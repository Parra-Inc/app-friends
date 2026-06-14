import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://appfriends:appfriends@localhost:5455/appfriends";
  const isLocalhost = databaseUrl.includes("localhost");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocalhost ? false : { rejectUnauthorized: true },
    idleTimeoutMillis: 5000,
    min: 1,
  });

  const adapter = new PrismaPg(
    pool as unknown as ConstructorParameters<typeof PrismaPg>[0]
  );

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
