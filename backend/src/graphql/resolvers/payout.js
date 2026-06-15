const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const checkStoreAccess = (
  store,
  user,
  includeRoles = ["owner", "manager", "courier"],
) => {
  if (!store || !user) return false;

  const checks = [];

  if (includeRoles.includes("owner")) {
    checks.push(store.ownerId === user.id);
  }

  if (includeRoles.includes("manager") && store.managers) {
    checks.push(store.managers.some((manager) => manager.id === user.id));
  }

  if (includeRoles.includes("courier") && store.couriers) {
    checks.push(store.couriers.some((courier) => courier.id === user.id));
  }

  return checks.some((check) => check === true);
};

const checkStoreIdAccess = async (
  storeId,
  user,
  includeRoles = ["owner", "manager", "courier"],
) => {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      owner: true,
      managers: includeRoles.includes("manager"),
      couriers: includeRoles.includes("courier"),
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  if (!checkStoreAccess(store, user, includeRoles)) {
    throw new Error("Access denied to this store");
  }

  return store;
};

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
      membership.permissions.includes(permission))
  ) {
    return true;
  }

  return false;
};

const payoutResolvers = {
  Query: {
    getStoreBankAccount: async (_, { storeId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Fetching bank account for store:",
        storeId,
        "by user:",
        user.id,
      );

      const permission = await checkPermission({storeId: storeId, clientId: user.id, permission: "PAYOUTS"})
      if (!permission) {
        throw new Error("Permission denied");
      }

      const bank = await prisma.store.findUnique({
        where: {
          id: storeId
        },
        select: {
          id: true,
          bankAccountNumber: true,
          bankAccountHolder: true,
          bankName: true,
          bankIban: true,
          bankSwiftCode: true,
          updatedAt: true,
        }
      })

      return bank;
    },
    getStoreTransactions: async (_, { storeId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Fetching transactions for store:",
        storeId,
        "by user:",
        user.id,
      );

      const permission = await checkPermission({storeId: storeId, clientId: user.id, permission: "PAYOUTS"})
      if (!permission) {
        throw new Error("Permission denied");
      }

      const transactions = await prisma.transaction.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
      });

      return transactions;
    },
    getTransaction: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching transaction:", id, "by user:", user.id);

      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          store: true,
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const permission = await checkPermission({storeId: transaction.store.storeId, clientId: user.id, permission: "PAYOUTS"})
      if (!permission) {
        throw new Error("Permission denied");
      }

      return transaction;
    },
  },
  Mutation: {
    updateBankAccount: async (_, { storeId, input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Updating bank account for store:",
        storeId,
        "by user:",
        user.id,
      );

      // Only store owners can update bank account
      const permission = await checkPermission({storeId: storeId, clientId: user.id, permission: "PAYOUTS"})
      if (!permission) {
        throw new Error("Permission denied");
      }

      const updatedStore = await prisma.store.update({
        where: { id: storeId },
        data: {
          bankAccountNumber: input.bankAccountNumber,
          bankAccountHolder: input.bankAccountHolder,
          bankName: input.bankName,
          bankIban: input.bankIban,
          bankSwiftCode: input.bankSwiftCode,
        },
      });

      console.log("Bank account updated successfully for store:", storeId);
      return updatedStore;
    },
    createTransaction: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Creating transaction for store:",
        input.storeId,
        "by user:",
        user.id,
      );

      const permission = await checkPermission({storeId: input.storeId, clientId: user.id, permission: "PAYOUTS"})
      if (!permission) {
        throw new Error("Permission denied");
      }

      // Calculate net amount if processing fee is provided
      let netAmount = input.amount;
      if (input.processingFee) {
        netAmount = input.amount - input.processingFee;
      }

      const transaction = await prisma.transaction.create({
        data: {
          storeId: input.storeId,
          amount: input.amount,
          type: input.type,
          description: input.description,
          externalId: input.externalId,
          paymentMethod: input.paymentMethod,
          currency: input.currency || "UAH",
          processingFee: input.processingFee,
          netAmount: netAmount,
          referenceOrderId: input.referenceOrderId,
          metadata: input.metadata,
          status: "PENDING",
        },
        include: {
          store: true,
        },
      });

      console.log("Transaction created successfully:", transaction.id);
      return transaction;
    },
    updateTransactionStatus: async (_, { id, status }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Updating transaction status:",
        id,
        "to:",
        status,
        "by user:",
        user.id,
      );

      const existingTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          store: true,
        },
      });

      if (!existingTransaction) {
        throw new Error("Transaction not found");
      }

      const permission = await checkPermission({storeId: existingTransaction.store.storeId, clientId: user.id, permission: "PAYOUTS"})
      if (!permission) {
        throw new Error("Permission denied");
      }

      const updateData = { status };

      // Set processedAt timestamp when transaction is completed or failed
      if (status === "COMPLETED" || status === "FAILED") {
        updateData.processedAt = new Date();
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: updateData,
        include: {
          store: true,
        },
      });

      console.log("Transaction status updated successfully:", id);
      return updatedTransaction;
    },
  },
  // Field resolvers
  Transaction: {
    store: async (parent) => {
      if (parent.store) return parent.store;

      return await prisma.store.findUnique({
        where: { id: parent.storeId },
      });
    },
  },
};

module.exports = payoutResolvers;
