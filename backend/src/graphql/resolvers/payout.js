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

const payoutResolvers = {
  Query: {
    getStoreBankAccount: async (_, { storeId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching bank account for store:", storeId, "by user:", user.id);

      const store = await checkStoreIdAccess(storeId, user, ['owner', 'manager']);

      return store;
    },
    getStoreTransactions: async (_, { storeId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching transactions for store:", storeId, "by user:", user.id);

      await checkStoreIdAccess(storeId, user, ['owner', 'manager']);

      const transactions = await prisma.transaction.findMany({
        where: { storeId },
        include: {
          store: true,
        },
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
          store: {
            include: {
              owner: true,
              managers: true,
              couriers: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (!checkStoreAccess(transaction.store, user, ['owner', 'manager'])) {
        throw new Error("Access denied to this transaction");
      }

      return transaction;
    },
  },
  Mutation: {
    updateBankAccount: async (_, { storeId, input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Updating bank account for store:", storeId, "by user:", user.id);

      // Only store owners can update bank account
      await checkStoreIdAccess(storeId, user, ['owner']);

      const updatedStore = await prisma.store.update({
        where: { id: storeId },
        data: {
          bankAccountNumber: input.bankAccountNumber,
          bankAccountHolder: input.bankAccountHolder,
          bankName: input.bankName,
          bankIban: input.bankIban,
          bankSwiftCode: input.bankSwiftCode,
        },
        include: {
          owner: true,
          managers: true,
          couriers: true,
        },
      });

      console.log("Bank account updated successfully for store:", storeId);
      return updatedStore;
    },
    createTransaction: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Creating transaction for store:", input.storeId, "by user:", user.id);

      // Only store owners and managers can create transactions
      await checkStoreIdAccess(input.storeId, user, ['owner', 'manager']);

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

      console.log("Updating transaction status:", id, "to:", status, "by user:", user.id);

      const existingTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          store: {
            include: {
              owner: true,
              managers: true,
              couriers: true,
            },
          },
        },
      });

      if (!existingTransaction) {
        throw new Error("Transaction not found");
      }

      if (!checkStoreAccess(existingTransaction.store, user, ['owner', 'manager'])) {
        throw new Error("Access denied to update this transaction");
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
        include: {
          owner: true,
          managers: true,
          couriers: true,
        },
      });
    },
  },
};

module.exports = payoutResolvers; 