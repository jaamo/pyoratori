import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: "postgresql://jaamo:postgres@localhost:5432/pyoratori",
  ssl: false,
});

export const db = drizzle(pool, { schema });
