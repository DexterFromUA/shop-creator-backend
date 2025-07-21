require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const schema = require('./graphql');
const { getUser } = require('./middleware/auth');

async function startServer() {
  const app = express();

  // Enable CORS for frontend
  app.use(cors({
    origin: [
      'http://localhost:3000',  // React dev server
      'http://localhost:3001',  // Alternative port
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
  }));

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const user = await getUser(req);
      return { req, user };
    },
  });

  await server.start();

  server.applyMiddleware({ app });

  app.use(express.json());

  app.get('/', (_, res) => {
    res.send('Backend is running 🚀');
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
