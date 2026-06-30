import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { test as baseTest } from "vitest";
import type { DB } from "@/db";
import * as schema from "@/db/schema";
import { user } from "@/db/schema";

export const test = baseTest
  .extend("db", { scope: "file" }, async ({}, { onCleanup }) => {
    // File-scoped DB
    const client = new PGlite();
    const db = drizzle(client, { schema });

    await migrate(db, { migrationsFolder: "drizzle" });

    onCleanup(async () => {
      await client.close();
    });

    return db;
  })
  .extend("tx", async ({ db }, { onCleanup }) => {
    let releaseTx: () => void;

    // Start a native Drizzle transaction and pause it
    const tx = await new Promise<DB>((resolve, reject) => {
      db.transaction(async (t) => {
        // Yield the transaction object to the Vitest fixture
        // (Cast to DB so your services accept it without type errors)
        resolve(t as unknown as DB);

        // Pause the Drizzle callback until the test finishes
        await new Promise<void>((res) => {
          releaseTx = res;
        });

        // Force a rollback to wipe the test data
        t.rollback();
      }).catch((err) => {
        // Drizzle throws a specific "Rollback" error when t.rollback() is called.
        // We expect this, so we ignore it. Throw any genuine errors.
        if (err.message !== "Rollback") reject(err);
      });
    });

    // When the test finishes, unpause the transaction so it rolls back
    onCleanup(() => {
      if (releaseTx) releaseTx();
    });

    return tx;
  })
  .extend<{ testUser: { id: string; name: string; email: string } }>({
    testUser: async ({ tx }, use) => {
      const id = `user_${Math.random().toString(36).slice(2)}`;
      const email = `${id}@example.com`;
      const name = "Test User";

      await tx.insert(user).values({ id, name, email });

      // Yield the user object to the test
      await use({ id, name, email });
    },
  });
