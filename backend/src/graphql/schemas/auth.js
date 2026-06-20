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

  enum Permissions {
    OWNER
    ORDERS
    PRODUCTS
    PAYOUTS
    NOTIFICATIONS
    USERS
    TEAM
    STORE
    APP
  }

  type StoreClients {
    storeId: String!
    clientId: String!
    store: Store
    client: Client
    permissions: [Permissions]!
    createdAt: String
    updatedAt: String
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
    clients: [StoreClients!]!
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

  type ProductOptions {
    id: ID!
    name: String!
    description: String
    productId: String!
    product: Product!
    price: Float
    isPreOrder: Boolean!
    isDiscount: Boolean!
    discountPercent: Int!
    isLimited: Boolean!
    quantity: Int!
    createdAt: String!
    updatedAt: String!
  }

  input ProductOptionsInput {
    id: ID
    name: String
    description: String
    price: Float!
    isPreOrder: Boolean
    isDiscount: Boolean
    discountPercent: Int
    isLimited: Boolean
    quantity: Int
  }

  type Range {
    min: Float!
    max: Float!
  }

  type Product {
    id: ID!
    name: String!
    description: String
    category: String
    amount: Int!
    productOptions: [ProductOptions]!
    imgUrls: [String!]
    storeId: String!
    store: Store!
    orderCount: Int!
    priceRange: Range!
    discountRange: Range!
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
    stores: [StoreClients]!
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
    category: String
    imgUrls: [String]
    storeId: String!
    productOptions: [ProductOptionsInput!]!
  }

  input UpdateProductInput {
    name: String
    description: String
    category: String
    imgUrls: [String!]
    productOptions: [ProductOptionsInput!]!
  }

  input UpdateStoreInput {
    name: String!
    description: String
    contactEmail: String
    contactPhone: String
    contactAddress: String
    contactCity: String
  }

  type PresignedUrlResponse {
    uploadUrl: String!
    fileKey: String!
  }

  type Query {
    hello: String
    me: Client
    myStores: [StoreClients]!
    store(id: ID!): StoreClients!
    storeProducts(storeId: ID!): [Product!]!
    product(id: ID!): Product!
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
    updateSubscription(input: UpdateSubscriptionInput!): Client!
    updatePaymentCard(input: UpdatePaymentCardInput!): Client!
    removePaymentCard: Client!
    uploadFiles(storeId: ID!, fileNames: [String!]!, fileTypes: [String!]!): [PresignedUrlResponse!]!
  }
`;

module.exports = authSchema;
