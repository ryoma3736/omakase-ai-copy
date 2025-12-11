import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  // DATABASE_URLがない場合はダミーアダプターで初期化
  // これによりビルド時のエラーを回避
  if (!connectionString) {
    // ビルド時用：実際のDB接続なしで初期化
    const dummyPool = new Pool({ connectionString: "postgresql://localhost:5432/dummy" });
    const adapter = new PrismaPg(dummyPool);
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// グローバルキャッシュを使用して再作成を防ぐ
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
