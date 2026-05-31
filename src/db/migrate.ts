import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { env } from "@/env";

/**
 * Migration runner script.
 * Applies all pending migrations from the 'drizzle/' folder to the database.
 */
async function main() {
  console.log("🚀 Starting database migrations...");

  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    const db = drizzle(client);

    await migrate(db, { migrationsFolder: "drizzle" });

    console.log("✅ Migrations completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
