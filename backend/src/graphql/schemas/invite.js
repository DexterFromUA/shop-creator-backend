const { gql } = require('apollo-server-express');

const inviteSchema = gql`
  enum TeamRole {
    MANAGER
    COURIER
  }

  type Invite {
    id: ID!
    token: String!
    email: String
    role: TeamRole!
    storeId: String!
    store: Store!
    createdAt: String!
    expiresAt: String!
    isUsed: Boolean!
    usedAt: String
    usedById: String
    usedBy: Client
    revoked: Boolean!
    revokedAt: String
  }

  input CreateInviteInput {
    email: String
    role: TeamRole!
    storeId: String!
  }

  extend type Query {
    getInvite(token: String!): Invite
    getStoreInvites(storeId: String!): [Invite!]!
  }

  extend type Mutation {
    createInvite(input: CreateInviteInput!): Invite!
    acceptInvite(token: String!): Client!
    revokeInvite(id: String!): Invite!
    removeTeamMember(storeId: String!, userId: String!): Client!
  }
`;

module.exports = inviteSchema; 