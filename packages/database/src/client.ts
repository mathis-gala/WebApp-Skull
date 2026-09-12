import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { projectConfig } from "@workspace/config/project"

import * as schema from "./schema/index.js"

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: projectConfig.database.maxConnections,
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
