const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const checkPermission = async ({ storeId, clientId, permission }) => {
  const membership = await prisma.storeClients.findUnique({
    where: {
      storeId_clientId: {
        storeId,
        clientId,
      },
    },
    select: {
      permissions: true,
    },
  });

  if (
    membership &&
    (membership.permissions.includes("OWNER") ||
      membership.permissions.includes(permission) ||
      permission === "any")
  ) {
    return true;
  }

  return false;
};

const inviteResolvers = {
  Query: {
    getInvite: async (_, { token }) => {
      console.log("Fetching invite with token:", token);

      const invite = await prisma.invite.findUnique({
        where: { token },
        include: {
          store: true,
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

      const permission = await checkPermission({
        storeId: storeId,
        clientId: user.id,
        permission: "TEAM",
      });
      if (!permission) {
        throw new Error("Store not found");
      }

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
    getStoreUsers: async (_, { storeId }, { user }) => {
      console.log(
        "Fetching invited users for store:",
        storeId,
        "by user:",
        user.id,
      );

      if (!user) {
        throw new Error("Not authenticated");
      }

      const permission = await checkPermission({
        storeId: storeId,
        clientId: user.id,
        permission: "TEAM",
      });
      if (!permission) {
        throw new Error("Store not found");
      }

      const store = await prisma.store.findUnique({
        where: {
          id: storeId,
        },
        select: {
          clients: {
            where: {
              NOT: [
                {
                  permissions: {
                    has: "OWNER",
                  },
                },
              ],
              client: {
                id: {
                  not: user.id,
                },
              },
            },
            select: {
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  usedInvites: {
                    where: {
                      storeId: storeId,
                    },
                    select: {
                      id: true,
                      permissions: true,
                    },
                    orderBy: {
                      usedAt: "desc",
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      return store.clients.map((client) => client.client);
    },
  },
  Mutation: {
    createInvite: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Creating invite for store:",
        input.storeId,
        "by user:",
        user.id,
      );

      const permission = await checkPermission({
        storeId: input.storeId,
        clientId: user.id,
        permission: "TEAM",
      });
      if (!permission) {
        throw new Error("Store not found");
      }

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

        const isAlreadyMember =
          store.ownerId === user.id ||
          store.managers.some((m) => m.email === input.email) ||
          store.couriers.some((c) => c.email === input.email);

        if (isAlreadyMember) {
          throw new Error("User is already a member of this store");
        }
      }

      // Create invite with 7 days expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const permissionsList = Object.entries(input)
        .filter(([key, value]) => typeof value === "boolean" && value)
        .map((el) => el[0].toUpperCase());

      const invite = await prisma.invite.create({
        data: {
          email: input.email,
          description: input?.description ?? "",
          permissions: [...permissionsList],
          storeId: input.storeId,
          expiresAt,
        },
        include: {
          store: true,
          usedBy: true,
        },
      });

      console.log("Invite created successfully:", invite.id);
      return invite;
    },

    acceptInvite: async (_, { token }, { user }) => {
      console.log("Accepting invite with token:", token, "by user:", user.id);
      if (!user) {
        throw new Error("Not authenticated");
      }

      const invite = await prisma.invite.findUnique({
        where: { token },
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

      const isAlreadyMember = await checkPermission({
        storeId: invite.storeId,
        clientId: user.id,
        permission: "any",
      });
      if (isAlreadyMember) {
        throw new Error("You are already a member of this store");
      }

      const [createResult, updateResult] = await prisma.$transaction([
        prisma.storeClients.create({
          data: {
            storeId: invite.storeId,
            clientId: user.id,
            permissions: invite.permissions,
          },
          include: {
            store: {
              select: {
                name: true,
              },
            },
          },
        }),
        prisma.invite.update({
          where: { id: invite.id },
          data: {
            isUsed: true,
            usedAt: new Date(),
            usedById: user.id,
          },
          select: {
            expiresAt: true,
          },
        }),
      ]);

      return { ...createResult, ...updateResult };
    },

    revokeInvite: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Revoking invite:", id, "by user:", user.id);

      const invite = await prisma.invite.findUnique({
        where: { id },
      });

      if (!invite) {
        throw new Error("Invite not found");
      }

      const permission = await checkPermission({
        storeId: invite.storeId,
        clientId: user.id,
        permission: "TEAM",
      });
      if (!permission) {
        throw new Error("Permission denied");
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
          store: true,
          usedBy: true,
        },
      });

      console.log("Invite revoked successfully:", id);
      return revokedInvite;
    },

    removeTeamMember: async (_, { storeId, userId }, { user }) => {
      console.log(
        "Removing team member:",
        userId,
        "from store:",
        storeId,
        "by user:",
        user.id,
      );

      if (!user) {
        throw new Error("Not authenticated");
      }

      const permission = await checkPermission({
        storeId: storeId,
        clientId: user.id,
        permission: "TEAM",
      });
      if (!permission) {
        throw new Error("Permission denied");
      }

      const membership = await prisma.storeClients.findUnique({
        where: {
          storeId_clientId: {
            storeId,
            clientId: userId,
          },
        },
        select: {
          permissions: true,
        },
      });
      if (!membership) {
        throw new Error("User doesn't exist");
      }
      if (membership.permissions.includes("OWNER")) {
        throw new Error("Cannot remove the store owner");
      }

      const userToRemove = await prisma.storeClients.delete({
        where: {
          storeId_clientId: {
            storeId,
            clientId: userId,
          },
        },
      });

      return userToRemove;
    },
  },
  // Field resolvers
  Invite: {
    store: async (parent) => {
      if (parent.store) return parent.store;

      return await prisma.store.findUnique({
        where: { id: parent.storeId },
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
