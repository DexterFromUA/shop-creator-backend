const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const client = await prisma.client.findUnique({
      where: { id: decoded.clientId },
      include: {
        stores: true,
      },
    });

    return client;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
};

module.exports = {
  getUser,
};
