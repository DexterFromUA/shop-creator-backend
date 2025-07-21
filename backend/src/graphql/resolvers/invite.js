const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const checkStoreAccess = (store, user, includeRoles = ['owner', 'manager', 'courier']) => {
  if (!store || !user) return false;
  
  const checks = [];
  
  if (includeRoles.includes('owner')) {
    checks.push(store.ownerId === user.id);
  }
  
  if (includeRoles.includes('manager') && store.managers) {
    checks.push(store.managers.some(manager => manager.id === user.id));
  }
  
  if (includeRoles.includes('courier') && store.couriers) {
    checks.push(store.couriers.some(courier => courier.id === user.id));
  }
  
  return checks.some(check => check === true);
};

const checkStoreIdAccess = async (storeId, user, includeRoles = ['owner', 'manager', 'courier']) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      owner: true,
      managers: includeRoles.includes('manager'),
      couriers: includeRoles.includes('courier'),
    }
  });

  if (!store) {
    throw new Error('Store not found');
  }

  if (!checkStoreAccess(store, user, includeRoles)) {
    throw new Error('Access denied to this store');
  }

  return store;
};

const inviteResolvers = {
  Query: {
    getInvite: async (_, { token }) => {
      console.log("Fetching invite with token:", token);

      const invite = await prisma.invite.findUnique({
        where: { token },
        include: {
          store: {
            include: {
              owner: true,
            },
          },
          usedBy: true,
        },
      });

      if (!invite) {
        throw new Error("Invite not found");
      }

      // Check if invite is expired
      if (new Date() > invite.expiresAt) {
        throw new Error("Invite has expired");
      }

      // Check if invite is already used
      if (invite.isUsed) {
        throw new Error("Invite has already been used");
      }

      return invite;
    },
    getStoreInvites: async (_, { storeId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching invites for store:", storeId, "by user:", user.id);

      // Only store owners and managers can view invites
      await checkStoreIdAccess(storeId, user, ['owner', 'manager']);

      const invites = await prisma.invite.findMany({
        where: { 
          storeId,
          // isUsed: false, // Only show unused invites
          // expiresAt: {
          //   gt: new Date(), // Only show non-expired invites
          // },
        },
        include: {
          store: true,
          usedBy: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return invites;
    },
  },
  Mutation: {
    createInvite: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Creating invite for store:", input.storeId, "by user:", user.id);

      // Only store owners and managers can create invites
      await checkStoreIdAccess(input.storeId, user, ['owner', 'manager']);

      // Check if there's already an active invite for this email and store (only if email is provided)
      if (input.email) {
        const existingInvite = await prisma.invite.findFirst({
          where: {
            email: input.email,
            storeId: input.storeId,
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (existingInvite) {
          throw new Error("Active invite already exists for this email");
        }

        // Check if user is already part of the team
        const store = await prisma.store.findUnique({
          where: { id: input.storeId },
          include: {
            managers: true,
            couriers: true,
          },
        });

        const isAlreadyMember = store.ownerId === user.id || 
          store.managers.some(m => m.email === input.email) ||
          store.couriers.some(c => c.email === input.email);

        if (isAlreadyMember) {
          throw new Error("User is already a member of this store");
        }
      }

      // Create invite with 7 days expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await prisma.invite.create({
        data: {
          email: input.email,
          role: input.role,
          storeId: input.storeId,
          expiresAt,
        },
        include: {
          store: {
            include: {
              owner: true,
            },
          },
          usedBy: true,
        },
      });

      console.log("Invite created successfully:", invite.id);
      return invite;
    },
    acceptInvite: async (_, { token }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Accepting invite with token:", token, "by user:", user.id);

      const invite = await prisma.invite.findUnique({
        where: { token },
        include: {
          store: {
            include: {
              managers: true,
              couriers: true,
            },
          },
        },
      });

      if (!invite) {
        throw new Error("Invite not found");
      }

      if (new Date() > invite.expiresAt) {
        throw new Error("Invite has expired");
      }

      if (invite.isUsed) {
        throw new Error("Invite has already been used");
      }

      if (invite.revoked) {
        throw new Error("Invite has been revoked");
      }

      // Check if user is already part of the team
      const isAlreadyMember = invite.store.ownerId === user.id || 
        invite.store.managers.some(m => m.id === user.id) ||
        invite.store.couriers.some(c => c.id === user.id);

      if (isAlreadyMember) {
        throw new Error("You are already a member of this store");
      }

      const updatedUser = await prisma.$transaction(async (prismaTransaction) => {
        await prismaTransaction.invite.update({
          where: { id: invite.id },
          data: {
            isUsed: true,
            usedAt: new Date(),
            usedById: user.id,
          },
        });

        if (invite.role === 'MANAGER') {
          await prismaTransaction.store.update({
            where: { id: invite.storeId },
            data: {
              managers: {
                connect: { id: user.id },
              },
            },
          });
        } else if (invite.role === 'COURIER') {
          await prismaTransaction.store.update({
            where: { id: invite.storeId },
            data: {
              couriers: {
                connect: { id: user.id },
              },
            },
          });
        }

        const updatedUser = await prismaTransaction.client.findUnique({
          where: { id: user.id },
          include: {
            stores: true,
            managingStores: true,
            deliveringStores: true,
          },
        });

        return updatedUser;
      });

      console.log("Invite accepted successfully for user:", user.id);
      return updatedUser;
    },
    revokeInvite: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Revoking invite:", id, "by user:", user.id);

      const invite = await prisma.invite.findUnique({
        where: { id },
        include: {
          store: {
            include: {
              owner: true,
              managers: true,
            },
          },
        },
      });

      if (!invite) {
        throw new Error("Invite not found");
      }

      if (!checkStoreAccess(invite.store, user, ['owner', 'manager'])) {
        throw new Error("Access denied to revoke this invite");
      }

      if (invite.isUsed) {
        throw new Error("Cannot revoke an already used invite");
      }

      if (invite.revoked) {
        throw new Error("Invite has already been revoked");
      }

      const revokedInvite = await prisma.invite.update({
        where: { id },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
        include: {
          store: {
            include: {
              owner: true,
            },
          },
          usedBy: true,
        },
      });

      console.log("Invite revoked successfully:", id);
      return revokedInvite;
    },
    removeTeamMember: async (_, { storeId, userId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Removing team member:", userId, "from store:", storeId, "by user:", user.id);

      // Only store owners and managers can remove team members
      const store = await checkStoreIdAccess(storeId, user, ['owner', 'manager']);

      // Cannot remove the store owner
      if (store.ownerId === userId) {
        throw new Error("Cannot remove the store owner");
      }

      // Get the user to be removed
      const userToRemove = await prisma.client.findUnique({
        where: { id: userId },
      });

      if (!userToRemove) {
        throw new Error("User not found");
      }

      // Check if user is actually a member of the store
      const isManager = store.managers && store.managers.some(m => m.id === userId);
      const isCourier = store.couriers && store.couriers.some(c => c.id === userId);

      if (!isManager && !isCourier) {
        throw new Error("User is not a member of this store");
      }

      // Remove user from the store team
      if (isManager) {
        await prisma.store.update({
          where: { id: storeId },
          data: {
            managers: {
              disconnect: { id: userId },
            },
          },
        });
      }

      if (isCourier) {
        await prisma.store.update({
          where: { id: storeId },
          data: {
            couriers: {
              disconnect: { id: userId },
            },
          },
        });
      }

      console.log("Team member removed successfully:", userId);
      return userToRemove;
    },
  },
  // Field resolvers
  Invite: {
    store: async (parent) => {
      if (parent.store) return parent.store;
      
      return await prisma.store.findUnique({
        where: { id: parent.storeId },
        include: {
          owner: true,
          managers: true,
          couriers: true,
        },
      });
    },
    usedBy: async (parent) => {
      if (!parent.usedById) return null;
      if (parent.usedBy) return parent.usedBy;
      
      return await prisma.client.findUnique({
        where: { id: parent.usedById },
      });
    },
  },
};

module.exports = inviteResolvers; 