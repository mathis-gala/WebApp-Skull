import { eq, inArray } from "drizzle-orm"

import { withVerifiedDatabaseTarget } from "@workspace/database/target"
import { MemoryEmailSender } from "@workspace/email"
import { getEnv } from "../config/env.js"
import { createAuth } from "../infrastructure/auth/auth.js"
import { AuthEmailDispatcher } from "../infrastructure/email/auth-email-dispatcher.js"
import { cleanAuthFixtures, seedAuthFixtures } from "../seeds/auth.js"
import type { AuthFixtureStore } from "../seeds/auth.js"

function shouldCleanFixtures(arguments_: ReadonlyArray<string>) {
  const index = arguments_.indexOf("--scenario")
  if (index < 0 || arguments_[index + 1] !== "auth") {
    throw new Error("Usage: db:seed -- --scenario auth")
  }
  return arguments_.includes("--clean")
}

const shouldClean = shouldCleanFixtures(process.argv.slice(2))

await withVerifiedDatabaseTarget(process.env, "seed", async (target) => {
  const { createDatabase, schema } = await import("@workspace/database")
  const env = getEnv(process.env)
  const database = createDatabase(target.databaseUrl)
  const emails = new AuthEmailDispatcher(
    new MemoryEmailSender(),
    () => undefined
  )
  const auth = createAuth(database.db, env, emails)
  const store: AuthFixtureStore = {
    async findByEmail(email) {
      return (
        (await database.db.query.user.findFirst({
          columns: { emailVerified: true, id: true },
          where: eq(schema.user.email, email),
        })) ?? null
      )
    },
    async create(fixture) {
      const result = await auth.api.signUpEmail({
        body: {
          email: fixture.email,
          name: fixture.name,
          password: fixture.password,
        },
      })
      return {
        id: result.user.id,
        emailVerified: result.user.emailVerified,
      }
    },
    async markEmailVerified(id) {
      await database.db
        .update(schema.user)
        .set({ emailVerified: true })
        .where(eq(schema.user.id, id))
    },
    async deleteByEmails(addresses) {
      return database.db.transaction(async (transaction) => {
        const fixtures = await transaction
          .select({ id: schema.user.id })
          .from(schema.user)
          .where(inArray(schema.user.email, [...addresses]))
        const fixtureIds = fixtures.map((fixture) => fixture.id)
        if (fixtureIds.length === 0) return 0

        // Better Auth 1.7 stores password-reset ownership in `value` as the
        // user id; email-verification links are stateless signed JWTs.
        await transaction
          .delete(schema.verification)
          .where(inArray(schema.verification.value, fixtureIds))
        const deleted = await transaction
          .delete(schema.user)
          .where(inArray(schema.user.id, fixtureIds))
          .returning({ id: schema.user.id })
        return deleted.length
      })
    },
  }

  try {
    if (shouldClean) {
      const deleted = await cleanAuthFixtures(store)
      console.log(`Auth fixtures removed: ${deleted}`)
      return
    }
    const result = await seedAuthFixtures(store)
    console.log(
      `Auth fixtures ready: ${result.created} created, ${result.preserved} preserved`
    )
  } finally {
    await emails.close()
    await database.close()
  }
})
