import { resolve } from "node:path"

import { withVerifiedDatabaseTarget } from "../target.js"

await withVerifiedDatabaseTarget(process.env, "migrate", async (target) => {
  const [{ createDatabase }, { migrate }] = await Promise.all([
    import("../client.js"),
    import("drizzle-orm/postgres-js/migrator"),
  ])
  const database = createDatabase(target.databaseUrl)

  try {
    await migrate(database.db, {
      migrationsFolder: resolve(import.meta.dirname, "../../drizzle"),
    })
    console.log(`Migrations applied to ${target.databaseName}`)
  } finally {
    await database.close()
  }
})
