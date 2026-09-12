export const AUTH_FIXTURE_PASSWORD = "Local-Only-Auth-2026!"

export type AuthFixture = Readonly<{
  email: string
  emailVerified: boolean
  name: string
  password: string
}>

export type ExistingAuthFixture = Readonly<{
  id: string
  emailVerified: boolean
}>

export interface AuthFixtureStore {
  findByEmail: (email: string) => Promise<ExistingAuthFixture | null>
  create: (fixture: AuthFixture) => Promise<ExistingAuthFixture>
  markEmailVerified: (id: string) => Promise<void>
  deleteByEmails: (emails: ReadonlyArray<string>) => Promise<number>
}

const AUTH_FIXTURES: ReadonlyArray<AuthFixture> = [
  {
    email: "verified@example.test",
    emailVerified: true,
    name: "Compte vérifié",
    password: AUTH_FIXTURE_PASSWORD,
  },
  {
    email: "unverified@example.test",
    emailVerified: false,
    name: "Compte non vérifié",
    password: AUTH_FIXTURE_PASSWORD,
  },
]

const AUTH_FIXTURE_EMAILS = AUTH_FIXTURES.map((fixture) => fixture.email)

export type AuthSeedResult = Readonly<{
  created: number
  preserved: number
}>

export async function seedAuthFixtures(
  store: AuthFixtureStore
): Promise<AuthSeedResult> {
  let created = 0
  let preserved = 0

  for (const fixture of AUTH_FIXTURES) {
    const existing = await store.findByEmail(fixture.email)
    if (existing) {
      preserved += 1
      continue
    }

    const user = await store.create(fixture)
    if (fixture.emailVerified) await store.markEmailVerified(user.id)
    created += 1
  }

  return { created, preserved }
}

export function cleanAuthFixtures(store: AuthFixtureStore): Promise<number> {
  return store.deleteByEmails(AUTH_FIXTURE_EMAILS)
}
