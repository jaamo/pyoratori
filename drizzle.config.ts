import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: process.env.DB_HOST
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        ssl: false,
      }
    : {
        url: "postgresql://jaamo:postgres@localhost:5432/pyoratori",
        ssl: false,
      },
});
