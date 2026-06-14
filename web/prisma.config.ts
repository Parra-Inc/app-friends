import "dotenv/config";
import type { PrismaConfig } from "prisma";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://appfriends:appfriends@localhost:5455/appfriends";

export default {
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
} satisfies PrismaConfig;
