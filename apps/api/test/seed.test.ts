import { describe, expect, it, vi } from "vitest"

import {
  AUTH_FIXTURE_PASSWORD,
  cleanAuthFixtures,
  seedAuthFixtures,
} from "../src/seeds/auth.js"
import type {
  AuthFixture,
  AuthFixtureStore,
  ExistingAuthFixture,
} from "../src/seeds/auth.js"

function createStore() {
  const users = new Map<string, ExistingAuthFixture>()
  const create = vi.fn(async (fixture: AuthFixture) => {
    const user = { id: `fixture-${users.size + 1}`, emailVerified: false }
    users.set(fixture.email, user)
    return user
  })
  const markEmailVerified = vi.fn(async (id: string) => {
    for (const [email, user] of users) {
      if (user.id === id) users.set(email, { ...user, emailVerified: true })
    }
  })
  const store: AuthFixtureStore = {
    findByEmail: (email) => Promise.resolve(users.get(email) ?? null),
    create,
    markEmailVerified,
    async deleteByEmails(emails) {
      let deleted = 0
      for (const email of emails) {
        if (users.delete(email)) deleted += 1
      }
      return deleted
    },
  }
  return { create, markEmailVerified, store, users }
}

describe("auth seed scenario", () => {
  it("creates verified and unverified fixtures through the auth boundary", async () => {
    const fixtureStore = createStore()

    await expect(seedAuthFixtures(fixtureStore.store)).resolves.toEqual({
      created: 2,
      preserved: 0,
    })
    expect(fixtureStore.create).toHaveBeenCalledTimes(2)
    expect(fixtureStore.create.mock.calls[0]?.[0].password).toBe(
      AUTH_FIXTURE_PASSWORD
    )
    expect(fixtureStore.users.get("verified@example.test")?.emailVerified).toBe(
      true
    )
    expect(
      fixtureStore.users.get("unverified@example.test")?.emailVerified
    ).toBe(false)
  })

  it("preserves every existing account when rerun", async () => {
    const fixtureStore = createStore()
    await seedAuthFixtures(fixtureStore.store)
    fixtureStore.create.mockClear()
    fixtureStore.markEmailVerified.mockClear()

    await expect(seedAuthFixtures(fixtureStore.store)).resolves.toEqual({
      created: 0,
      preserved: 2,
    })
    expect(fixtureStore.create).not.toHaveBeenCalled()
    expect(fixtureStore.markEmailVerified).not.toHaveBeenCalled()
  })

  it("cleans only the named auth fixtures when explicitly requested", async () => {
    const fixtureStore = createStore()
    await seedAuthFixtures(fixtureStore.store)
    fixtureStore.users.set("developer@example.test", {
      id: "developer",
      emailVerified: true,
    })

    await expect(cleanAuthFixtures(fixtureStore.store)).resolves.toBe(2)
    expect([...fixtureStore.users.keys()]).toEqual(["developer@example.test"])
  })
})
