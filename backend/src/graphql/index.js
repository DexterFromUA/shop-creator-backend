const { makeExecutableSchema } = require('apollo-server-express');
const authSchema = require('./schemas/auth');
const inviteSchema = require('./schemas/invite');
const payoutSchema = require('./schemas/payout');
const authResolvers = require('./resolvers/auth');
const inviteResolvers = require('./resolvers/invite');
const payoutResolvers = require('./resolvers/payout');

const schema = makeExecutableSchema({
  typeDefs: [authSchema, inviteSchema, payoutSchema],
  resolvers: [authResolvers, inviteResolvers, payoutResolvers],
});

module.exports = schema;
