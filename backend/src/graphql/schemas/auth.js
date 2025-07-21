const { gql } = require('apollo-server-express');

const authSchema = gql`
  enum Role {
    ADMIN
    USER
  }

  enum SubscriptionType {
    BASIC
    ADVANCED
    PRO
    UNLIMITED
  }

  enum Size {
    XS
    S
    M
    L
    XL
    XXL
  }

  type Store {
    id: ID!
    name: String!
    description: String
    contactEmail: String
    contactPhone: String
    contactAddress: String
    contactCity: String
    isActive: Boolean!
    appId: String
    app: App
    owner: Client!
    managers: [Client!]!
    couriers: [Client!]!
    products: [Product!]!
    bankAccountNumber: String
    bankAccountHolder: String
    bankName: String
    bankIban: String
    bankSwiftCode: String
    createdAt: String!
    updatedAt: String!
  }

  type App {
    id: ID!
    name: String!
    description: String
    slug: String!
    version: String!
    iconUrl: String
    splashScreenUrl: String
    primaryColor: String!
    secondaryColor: String!
    targetPlatforms: [String!]!
    defaultLanguage: String!
    currency: String!
    keywords: [String!]!
    screenshots: [String!]!
    storeId: String
    store: Store
    appUrl: String
    createdAt: String!
    updatedAt: String!
  }

  type ProductSize {
    id: ID!
    size: Size!
    quantity: Int!
    productId: String!
    product: Product!
    createdAt: String!
    updatedAt: String!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String
    amount: Int!
    sizeInventory: [ProductSize!]!
    isPreOrder: Boolean!
    isDiscount: Boolean!
    discountPercent: Int!
    imgUrls: [String!]
    storeId: String!
    store: Store!
    orderCount: Int!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Client {
    id: ID!
    email: String!
    name: String
    phone: String
    emailVerified: Boolean!
    phoneVerified: Boolean!
    role: Role!
    stores: [Store!]!
    managingStores: [Store!]!
    deliveringStores: [Store!]!
    subscriptionActive: Boolean!
    subscriptionType: SubscriptionType!
    subscriptionStartDate: String
    subscriptionEndDate: String
    paymentCardNumber: String
    paymentCardHolder: String
    paymentCardExpiryMonth: Int
    paymentCardExpiryYear: Int
    paymentCardCvv: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    client: Client!
  }

  input CreateStoreInput {
    name: String!
    description: String
    contactEmail: String
    contactPhone: String
    contactAddress: String
    contactCity: String
  }

  input UpdateSubscriptionInput {
    subscriptionType: SubscriptionType!
  }

  input UpdatePaymentCardInput {
    paymentCardNumber: String!
    paymentCardHolder: String!
    paymentCardExpiryMonth: Int!
    paymentCardExpiryYear: Int!
    paymentCardCvv: String!
  }

  input CreateAppInput {
    name: String!
    description: String
    slug: String!
    iconUrl: String
    splashScreenUrl: String
    primaryColor: String!
    secondaryColor: String!
    targetPlatforms: [String!]!
    defaultLanguage: String!
    currency: String!
    keywords: [String!]!
    screenshots: [String!]!
    storeId: String!
  }

  input ProductSizeInput {
    size: Size!
    quantity: Int!
  }

  input CreateProductInput {
    name: String!
    description: String
    price: Float!
    category: String
    isPreOrder: Boolean!
    isDiscount: Boolean!
    discountPercent: Int!
    imgUrls: [String!]
    sizeInventory: [ProductSizeInput!]!
    storeId: String!
  }

  input UpdateProductInput {
    name: String
    description: String
    price: Float
    category: String
    isPreOrder: Boolean
    isDiscount: Boolean
    discountPercent: Int
    imgUrls: [String!]
    sizeInventory: [ProductSizeInput!]
  }

  input UpdateStoreInput {
    name: String!
    description: String
    contactEmail: String
    contactPhone: String
    contactAddress: String
    contactCity: String
  }

  type Query {
    hello: String
    me: Client
    myStores: [Store!]!
    store(id: ID!): Store
    storeProducts(storeId: ID!): [Product!]!
    product(id: ID!): Product
  }

  type Mutation {
    register(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createStore(input: CreateStoreInput!): Store!
    updateStore(id: ID!, input: UpdateStoreInput!): Store!
    createApp(input: CreateAppInput!): App!
    createProduct(input: CreateProductInput!): Product!
    deleteProduct(id: ID!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    updateProductStock(id: ID!, sizeInventory: [ProductSizeInput!]!): Product!
    updateSubscription(input: UpdateSubscriptionInput!): Client!
    updatePaymentCard(input: UpdatePaymentCardInput!): Client!
    removePaymentCard: Client!
  }
`;

module.exports = authSchema;
