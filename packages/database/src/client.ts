import { drizzle } from "drizzle-orm/postgres-js"
import { sql } from "drizzle-orm"
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
    ready: async () => {
      await db.execute(sql`select 1`)
    },
  }
}

export type Database = ReturnType<typeof createDatabase>["db"]
