import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const connectToDB = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully...");
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

export { prisma, connectToDB };
