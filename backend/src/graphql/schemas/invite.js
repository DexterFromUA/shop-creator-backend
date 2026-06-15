const { gql } = require('apollo-server-express');

const inviteSchema = gql`

  type Invite {
    id: ID!
    token: String!
    email: String
    description: String
    permissions: [Permissions]!
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
    description: String
    orders: Boolean!
    products: Boolean!
    payouts: Boolean!
    notifications: Boolean!
    users: Boolean!
    team: Boolean!
    app: Boolean!
    store: Boolean!
    storeId: String!
  }

  type UsedInvites {
    id: String!
    permissions: [String]!
  }

  type GetStoreUsersResponse {
    id: String!
    name: String!
    email: String
    usedInvites: [UsedInvites]!
  }

  type AcceptInviteStoreResponse {
    name: String!
  }

  type AcceptInviteResponse {
    storeId: String!
    clientId: String!
    permissions: [String]!
    expiresAt: String
    store: AcceptInviteStoreResponse!
  }

  type RemoveTeamMemberResponse {
    storeId: String!
    clientId: String!
    permissions: [Permissions]!
    createdAt: String
    updatedAt: String
  }

  extend type Query {
    getInvite(token: String!): Invite
    getStoreInvites(storeId: String!): [Invite!]!
    getStoreUsers(storeId: String!): [GetStoreUsersResponse]!
  }

  extend type Mutation {
    createInvite(input: CreateInviteInput!): Invite!
    acceptInvite(token: String!): AcceptInviteResponse!
    revokeInvite(id: String!): Invite!
    removeTeamMember(storeId: String!, userId: String!): RemoveTeamMemberResponse!
  }
`;

module.exports = inviteSchema; 