const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
      membership.permissions.includes(permission))
  ) {
    return true;
  }

  return false;
};

const authResolvers = {
  Query: {
    hello: () => "world",
    me: (_, __, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }
      return user;
    },
    myStores: async (_, __, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching stores for user:", user.id);

      const stores = await prisma.storeClients.findMany({
        where: {
          clientId: user.id,
        },
        include: {
          store: true,
          client: true,
        },
      });

      return stores;
    },
    store: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching store with ID:", id, "for user:", user.id);

      const store = await prisma.storeClients.findUnique({
        where: {
          storeId_clientId: {
            storeId: id,
            clientId: user.id,
          },
        },
        include: {
          store: true,
        },
      });

      if (!store) {
        throw new Error("Store not found");
      }

      return store;
    },
    storeProducts: async (_, { storeId }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching products for store:", storeId, "by user:", user.id);

      const permission = await checkPermission({
        storeId: storeId,
        clientId: user.id,
        permission: "PRODUCTS",
      });

      if (!permission) {
        throw new Error("Store not found");
      }

      const products = await prisma.product.findMany({
        where: { storeId },
        include: {
          sizeInventory: true,
          store: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return products;
    },
    product: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Fetching product:", id, "by user:", user.id);

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          sizeInventory: true,
          store: true,
        },
      });

      const permission = await checkPermission({
        storeId: product.storeId,
        clientId: user.id,
        permission: "PRODUCTS",
      });

      if (!product || !permission) {
        throw new Error("Store not found");
      }

      return product;
    },
  },
  Mutation: {
    register: async (_, { email, password, name }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const client = await prisma.client.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        include: {
          stores: true,
        },
      });

      const token = jwt.sign({ clientId: client.id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return {
        token,
        client,
      };
    },
    login: async (_, { email, password }) => {
      const client = await prisma.client.findUnique({
        where: { email },
        include: {
          stores: true,
        },
      });
      if (!client) {
        throw new Error("Invalid email or password");
      }

      const valid = await bcrypt.compare(password, client.password);
      if (!valid) {
        throw new Error("Invalid email or password");
      }

      const token = jwt.sign({ clientId: client.id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return {
        token,
        client,
      };
    },
    createStore: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Creating store...");

      const store = await prisma.store.create({
        data: {
          name: input.name,
          description: input.description,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          contactAddress: input.contactAddress,
          contactCity: input.contactCity,
          website: input.website !== undefined ? input.website : undefined,
          clients: {
            create: {
              clientId: user.id,
              permissions: ["OWNER"],
            },
          },
        },
      });
      console.log('store resolver', store)

      return store;
    },
    updateStore: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Updating store:", id, "by user:", user.id);

      const permission = await checkPermission({
        storeId: id,
        clientId: user.id,
        permission: "STORE",
      });

      if (!permission) {
        throw new Error("Store not found");
      }

      const updatedStore = await prisma.store.update({
        where: { id },
        data: {
          name: input.name !== undefined ? input.name : undefined,
          description:
            input.description !== undefined ? input.description : undefined,
          contactEmail:
            input.contactEmail !== undefined ? input.contactEmail : undefined,
          contactPhone:
            input.contactPhone !== undefined ? input.contactPhone : undefined,
          contactAddress:
            input.contactAddress !== undefined
              ? input.contactAddress
              : undefined,
          contactCity:
            input.contactCity !== undefined ? input.contactCity : undefined,
        },
      });

      console.log("Store updated successfully:", updatedStore.id);
      return updatedStore;
    },
    updateSubscription: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      const client = await prisma.client.update({
        where: { id: user.id },
        data: {
          subscriptionType: input.subscriptionType,
          subscriptionActive: true,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        },
      });

      return client;
    },
    updatePaymentCard: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Updating payment card for user:", user.id);

      const client = await prisma.client.update({
        where: { id: user.id },
        data: {
          paymentCardNumber: input.paymentCardNumber,
          paymentCardHolder: input.paymentCardHolder,
          paymentCardExpiryMonth: input.paymentCardExpiryMonth,
          paymentCardExpiryYear: input.paymentCardExpiryYear,
          paymentCardCvv: input.paymentCardCvv,
        },
      });

      return client;
    },
    removePaymentCard: async (_, {}, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Removing payment card for user:", user.id);

      const client = await prisma.client.update({
        where: { id: user.id },
        data: {
          paymentCardNumber: null,
          paymentCardHolder: null,
          paymentCardExpiryMonth: null,
          paymentCardExpiryYear: null,
          paymentCardCvv: null,
        },
      });

      return client;
    },
    createApp: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Creating app for store:",
        input.storeId,
        "by user:",
        user.id,
      );

      const permission = await checkPermission({
        storeId: input.storeId,
        clientId: user.id,
        permission: "APP",
      });

      if (!permission) {
        throw new Error("Cant find the store");
      }

      if (store.appId) {
        throw new Error("Store already has an app");
      }

      const existingApp = await prisma.app.findUnique({
        where: { slug: input.slug },
      });

      if (existingApp) {
        throw new Error("App with this slug already exists");
      }

      const app = await prisma.app.create({
        data: {
          name: input.name,
          description: input.description,
          slug: input.slug,
          iconUrl: input.iconUrl,
          splashScreenUrl: input.splashScreenUrl,
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
          targetPlatforms: input.targetPlatforms,
          defaultLanguage: input.defaultLanguage,
          currency: input.currency,
          keywords: input.keywords,
          screenshots: input.screenshots,
          storeId: input.storeId,
        },
      });

      await prisma.store.update({
        where: { id: input.storeId },
        data: { appId: app.id },
      });

      return app;
    },
    createProduct: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log(
        "Creating product for store:",
        input.storeId,
        "by user:",
        user.id,
      );

      const permission = await checkPermission({
        storeId: input.storeId,
        clientId: user.id,
        permission: "PRODUCTS",
      });
      if (!permission) {
        throw new Error("Cant find the store");
      }

      const product = await prisma.$transaction(async (prismaTransaction) => {
        const newProduct = await prismaTransaction.product.create({
          data: {
            name: input.name,
            description: input.description,
            price: input.price,
            category: input.category,
            isPreOrder: input.isPreOrder,
            isDiscount: input.isDiscount,
            discountPercent: input.discountPercent,
            imgUrls: input.imgUrls,
            storeId: input.storeId,
            amount: 0,
            orderCount: 0,
          },
        });

        const sizeInventory = await prismaTransaction.productSize.createMany({
          data: input.sizeInventory.map((size) => ({
            size: size.size,
            quantity: size.quantity,
            productId: newProduct.id,
          })),
        });

        const totalAmount = input.sizeInventory.reduce(
          (sum, size) => sum + size.quantity,
          0,
        );

        const updatedProduct = await prismaTransaction.product.update({
          where: { id: newProduct.id },
          data: { amount: totalAmount },
          include: {
            sizeInventory: true,
            store: true,
          },
        });

        return updatedProduct;
      });

      console.log("Product created successfully:", product.id);
      return product;
    },
    updateProduct: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Updating product:", id, "by user:", user.id);

      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          sizeInventory: true,
          store: true,
        },
      });

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      const permission = await checkPermission({
        storeId: existingProduct.storeId,
        clientId: user.id,
        permission: "PRODUCTS",
      });
      if (!permission) {
        throw new Error("Store not found");
      }

      const updatedProduct = await prisma.$transaction(
        async (prismaTransaction) => {
          const updateData = {};

          // Only update fields that are provided
          if (input.name !== undefined) updateData.name = input.name;
          if (input.description !== undefined)
            updateData.description = input.description;
          if (input.price !== undefined) updateData.price = input.price;
          if (input.category !== undefined)
            updateData.category = input.category;
          if (input.isPreOrder !== undefined)
            updateData.isPreOrder = input.isPreOrder;
          if (input.isDiscount !== undefined)
            updateData.isDiscount = input.isDiscount;
          if (input.discountPercent !== undefined)
            updateData.discountPercent = input.discountPercent;
          if (input.imgUrls !== undefined) updateData.imgUrls = input.imgUrls;

          // Update size inventory if provided
          if (input.sizeInventory) {
            // Delete existing size inventory
            await prismaTransaction.productSize.deleteMany({
              where: { productId: id },
            });

            // Create new size inventory entries
            if (input.sizeInventory.length > 0) {
              await prismaTransaction.productSize.createMany({
                data: input.sizeInventory.map((size) => ({
                  size: size.size,
                  quantity: size.quantity,
                  productId: id,
                })),
              });
            }

            // Calculate new total amount
            const totalAmount = input.sizeInventory.reduce(
              (sum, size) => sum + size.quantity,
              0,
            );
            updateData.amount = totalAmount;
          }

          // Update the product
          const product = await prismaTransaction.product.update({
            where: { id },
            data: updateData,
            include: {
              sizeInventory: true,
              store: true,
            },
          });

          return product;
        },
      );

      console.log("Product updated successfully:", updatedProduct.id);
      return updatedProduct;
    },
    deleteProduct: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Deleting product:", id, "by user:", user.id);

      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      const permission = await checkPermission({
        storeId: existingProduct.storeId,
        clientId: user.id,
        permission: "PRODUCTS",
      });
      if (!permission) {
        throw new Error("Store not found");
      }

      const deletedProduct = await prisma.$transaction(
        async (prismaTransaction) => {
          // First delete all size inventory entries
          await prismaTransaction.productSize.deleteMany({
            where: { productId: id },
          });

          // Then delete the product itself
          const product = await prismaTransaction.product.delete({
            where: { id },
            include: {
              sizeInventory: true,
              store: true,
            },
          });

          return product;
        },
      );

      console.log("Product deleted successfully:", deletedProduct.id);
      return deletedProduct;
    },
    updateProductStock: async (_, { id, sizeInventory }, { user }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Updating product stock:", id, "by user:", user.id);

      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new Error("Product not found");
      }

      const permission = await checkPermission({
        storeId: existingProduct.storeId,
        clientId: user.id,
        permission: "PRODUCTS",
      });
      if (!permission) {
        throw new Error("Store not found");
      }

      const updatedProduct = await prisma.$transaction(
        async (prismaTransaction) => {
          // Delete existing size inventory
          await prismaTransaction.productSize.deleteMany({
            where: { productId: id },
          });

          // Create new size inventory entries
          await prismaTransaction.productSize.createMany({
            data: sizeInventory.map((size) => ({
              size: size.size,
              quantity: size.quantity,
              productId: id,
            })),
          });

          // Calculate new total amount
          const totalAmount = sizeInventory.reduce(
            (sum, size) => sum + size.quantity,
            0,
          );

          // Update product with new total amount
          const product = await prismaTransaction.product.update({
            where: { id },
            data: { amount: totalAmount },
            include: {
              sizeInventory: true,
              store: true,
            },
          });

          return product;
        },
      );

      console.log("Product stock updated successfully:", updatedProduct.id);
      return updatedProduct;
    },
  },
  Store: {
    products: async (parent) => {
      return await prisma.product.findMany({
        where: { storeId: parent.id },
        include: {
          sizeInventory: true,
          store: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  Product: {
    store: async (parent) => {
      return await prisma.store.findUnique({
        where: { id: parent.storeId },
        include: {
          owner: true,
          managers: true,
          couriers: true,
          app: true,
        },
      });
    },
  },
  ProductSize: {
    product: async (parent) => {
      return await prisma.product.findUnique({
        where: { id: parent.productId },
        include: {
          sizeInventory: true,
          store: true,
        },
      });
    },
  },
};

module.exports = authResolvers;
