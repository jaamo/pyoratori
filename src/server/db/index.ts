import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool(
  process.env.DB_HOST
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: false,
      }
    : {
        connectionString: "postgresql://jaamo:postgres@localhost:5432/pyoratori",
        ssl: false,
      },
);

export const db = drizzle(pool, { schema });
