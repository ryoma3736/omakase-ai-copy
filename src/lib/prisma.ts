import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // For development with docker-compose PostgreSQL
  const connectionString = process.env.DATABASE_URL || "";

  // Check if using Prisma Postgres (prisma+postgres://) or standard PostgreSQL
  if (connectionString.startsWith("prisma+postgres://")) {
    // Prisma Postgres (Accelerate) - use accelerateUrl
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } else {
    // Standard PostgreSQL - use pg adapter
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
