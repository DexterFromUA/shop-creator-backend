const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const client = await prisma.client.findUnique({
      where: { id: decoded.clientId },
      include: {
        stores: true,
        managingStores: true,
        deliveringStores: true
      }
    });

    if (!client) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = client;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GraphQL context helper
const getUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const client = await prisma.client.findUnique({
      where: { id: decoded.clientId },
      include: {
        stores: true,
        managingStores: true,
        deliveringStores: true
      }
    });

    return client;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

module.exports = {
  authMiddleware,
  getUser,
}; 