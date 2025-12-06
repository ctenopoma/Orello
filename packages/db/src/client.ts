import { PGlite } from "@electric-sql/pglite";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import path from "path";

import * as schema from "./schema";

export type dbClient = NodePgDatabase<typeof schema> & {
  $client: Pool;
};

// Singleton instance and initialization promise
let dbInstance: dbClient | null = null;
let dbInitPromise: Promise<dbClient> | null = null;

const initializePGlite = async (): Promise<dbClient> => {
  const dataDir =
    process.env.PGLITE_DATA_DIR || path.resolve(process.cwd(), "pgdata");
  const migrationsFolder =
    process.env.MIGRATIONS_DIR ||
    path.resolve(process.cwd(), "../../packages/db/migrations");

  console.log(`Using PGlite with dataDir: ${dataDir}`);
  console.log(`Using migrations from: ${migrationsFolder}`);

  const client = new PGlite({
    dataDir,
  });
  const db = drizzlePgLite(client, { schema });

  // Await migration to complete before returning
  await migrate(db, { migrationsFolder });
  console.log("PGlite migrations completed successfully");

  return db as unknown as dbClient;
};

export const createDrizzleClient = (): dbClient => {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.log("POSTGRES_URL environment variable is not set, using PGLite");

    // Return cached instance if available
    if (dbInstance) {
      return dbInstance;
    }

    // Start initialization if not already started
    if (!dbInitPromise) {
      dbInitPromise = initializePGlite().then((db) => {
        dbInstance = db;
        return db;
      });
    }

    // For synchronous compatibility, we need to handle this differently
    // Use a proxy that waits for initialization
    const proxy = new Proxy({} as dbClient, {
      get(_target, prop) {
        if (!dbInstance) {
          throw new Error(
            "Database not yet initialized. Please ensure initialization completes before use.",
          );
        }
        return (dbInstance as any)[prop];
      },
    });

    // Trigger initialization
    dbInitPromise.catch((err) => {
      console.error("Failed to initialize PGlite:", err);
    });

    return proxy;
  }

  const pool = new Pool({
    connectionString,
  });

  return drizzlePg(pool, { schema }) as dbClient;
};

// Async initialization function for proper startup
export const initializeDatabase = async (): Promise<dbClient> => {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    if (dbInstance) {
      return dbInstance;
    }
    if (!dbInitPromise) {
      dbInitPromise = initializePGlite().then((db) => {
        dbInstance = db;
        return db;
      });
    }
    return dbInitPromise;
  }

  const pool = new Pool({
    connectionString,
  });

  return drizzlePg(pool, { schema }) as dbClient;
};

