import { hashPassword } from "better-auth/crypto"
import { inArray, or } from "drizzle-orm"

import { withVerifiedDatabaseTarget } from "@workspace/database/target"
import { createSeedRegistry } from "../seeds/registry.js"
import { runSeedCommand } from "../seeds/seed.js"
import { parseSeedCommand } from "./seed-command.js"
import type { AuthFixtureStore, PreparedAuthFixture } from "../seeds/auth.js"

const command = parseSeedCommand(process.argv.slice(2))

await withVerifiedDatabaseTarget(process.env, "seed", async (target) => {
  const { createDatabase, schema } = await import("@workspace/database")
  const database = createDatabase(target.databaseUrl)

  async function removeFixtures(
    transaction: Parameters<Parameters<typeof database.db.transaction>[0]>[0],
    fixtureIds: ReadonlyArray<string>
  ) {
    if (fixtureIds.length === 0) return
    // Better Auth 1.7 stores password-reset ownership in `value` as the
    // user id; email-verification links are stateless signed JWTs.
    await transaction
      .delete(schema.verification)
      .where(inArray(schema.verification.value, [...fixtureIds]))
    await transaction
      .delete(schema.user)
      .where(inArray(schema.user.id, [...fixtureIds]))
  }

  const store: AuthFixtureStore = {
    async findReserved(reservations) {
      const reservedAccounts = await database.db.query.account.findMany({
        columns: { userId: true },
        where: inArray(schema.account.id, [...reservations.accountIds]),
      })
      return database.db.query.user.findMany({
        where: or(
          inArray(schema.user.email, [...reservations.emails]),
          inArray(schema.user.id, [
            ...reservations.userIds,
            ...reservedAccounts.map(({ userId }) => userId),
          ])
        ),
        with: { accounts: true },
      })
    },
    async replaceRecognized(fixtureIds, fixtures) {
      await database.db.transaction(async (transaction) => {
        await removeFixtures(transaction, fixtureIds)
        await transaction.insert(schema.user).values(
          fixtures.map(({ id, name, email, emailVerified }) => ({
            id,
            name,
            email,
            emailVerified,
          }))
        )
        await transaction
          .insert(schema.account)
          .values(fixtures.map(toCredentialAccount))
      })
    },
    async removeRecognized(fixtureIds) {
      await database.db.transaction((transaction) =>
        removeFixtures(transaction, fixtureIds)
      )
    },
  }

  try {
    await runSeedCommand(
      command,
      createSeedRegistry({ authStore: store, hashPassword })
    )
    console.log(
      command.clean ? "Seed cleanup complete" : "Seed scenarios ready"
    )
  } finally {
    await database.close()
  }
})

function toCredentialAccount(fixture: PreparedAuthFixture) {
  return {
    id: fixture.accountId,
    accountId: fixture.id,
    providerId: "credential",
    userId: fixture.id,
    password: fixture.passwordHash,
  }
}
