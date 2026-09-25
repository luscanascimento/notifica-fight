import "dotenv/config";
import { defineConfig } from "prisma/config";

const localDevelopmentUrl =
  "postgresql://notifica:notifica_dev@localhost:5432/notifica_fight?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? localDevelopmentUrl,
  },
});
