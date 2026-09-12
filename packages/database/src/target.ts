export type DatabaseOperation = "migrate" | "seed"

export type VerifiedDatabaseTarget = Readonly<{
  databaseName: "webapp_skull" | "skull_auth_test"
  databaseUrl: string
  environment: "development" | "test"
}>

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])

function refusal(reason: string): never {
  throw new Error(`Refusing database operation: ${reason}`)
}

export function verifyDatabaseTarget(
  source: Record<string, string | undefined>,
  operation: DatabaseOperation
): VerifiedDatabaseTarget {
  const environment = source.APP_ENV
  if (environment !== "development" && environment !== "test") {
    refusal("APP_ENV must be development or test")
  }

  const rawUrl = source.DATABASE_URL
  if (!rawUrl) refusal("DATABASE_URL is required")

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    refusal("DATABASE_URL must be a valid URL")
  }

  if (target.protocol !== "postgres:" && target.protocol !== "postgresql:") {
    refusal("only PostgreSQL targets are supported")
  }
  if (!LOOPBACK_HOSTS.has(target.hostname)) {
    refusal("the database host must be loopback")
  }

  const databaseName = decodeURIComponent(target.pathname.slice(1))
  const expectedName =
    environment === "development" ? "webapp_skull" : "skull_auth_test"
  if (databaseName !== expectedName) {
    refusal(`expected database ${expectedName}`)
  }

  if (
    environment === "test" &&
    !source.DATABASE_TEST_OWNED?.startsWith("skull-code004-test-")
  ) {
    refusal("an owned test run is required")
  }

  if (operation === "seed" && source.DATABASE_FIXTURE_MODE !== "auth") {
    refusal("fixture mode auth is required")
  }

  return {
    databaseName: expectedName,
    databaseUrl: target.toString(),
    environment,
  }
}

export async function withVerifiedDatabaseTarget<T>(
  source: Record<string, string | undefined>,
  operation: DatabaseOperation,
  run: (target: VerifiedDatabaseTarget) => Promise<T>
): Promise<T> {
  const target = verifyDatabaseTarget(source, operation)
  return run(target)
}
