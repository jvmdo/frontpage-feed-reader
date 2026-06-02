import { neonConfig, Pool } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import ws from "ws";
import { env } from "@/env";
import * as schema from "./schema";

const isServerless = typeof window === "undefined" && !!process.env.VERCEL;

if (isServerless) {
  neonConfig.webSocketConstructor = ws;
}

export const db: DB = isServerless
  ? drizzleNeon(new Pool({ connectionString: env.DATABASE_URL }), { schema })
  : drizzlePg(env.DATABASE_URL, { schema });

export type DB = PgDatabase<
  any,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
