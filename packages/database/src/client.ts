import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { databaseConfig } from "./config.js"
import * as schema from "./schema/index.js"

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: databaseConfig.maxConnections,
    prepare: false,
  })
  const db = drizzle({
    client,
    schema,
  })

  return {
    db,
    close: () => client.end(),
  }
}

export type Database = ReturnType<typeof createDatabase>["db"]
