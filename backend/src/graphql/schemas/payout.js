const { gql } = require('apollo-server-express');

const payoutSchema = gql`
  enum TransactionType {
    SALE
    PAYOUT
    REFUND
    FEE
    CHARGEBACK
    ADJUSTMENT
  }

  enum TransactionStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
    DISPUTED
  }

  type Transaction {
    id: ID!
    storeId: String!
    store: Store!
    amount: Float!
    type: TransactionType!
    status: TransactionStatus!
    description: String
    externalId: String
    paymentMethod: String
    currency: String!
    processingFee: Float
    netAmount: Float
    referenceOrderId: String
    metadata: String
    createdAt: String!
    updatedAt: String!
    processedAt: String
  }

  input UpdateBankAccountInput {
    bankAccountNumber: String
    bankAccountHolder: String
    bankName: String
    bankIban: String
    bankSwiftCode: String
  }

  input CreateTransactionInput {
    storeId: String!
    amount: Float!
    type: TransactionType!
    description: String
    externalId: String
    paymentMethod: String
    currency: String = "UAH"
    processingFee: Float
    referenceOrderId: String
    metadata: String
  }



  extend type Query {
    getStoreBankAccount(storeId: String!): Store
    getStoreTransactions(storeId: String!): [Transaction!]!
    getTransaction(id: String!): Transaction
  }

  extend type Mutation {
    updateBankAccount(storeId: String!, input: UpdateBankAccountInput!): Store!
    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransactionStatus(id: String!, status: TransactionStatus!): Transaction!
  }
`;

module.exports = payoutSchema; 