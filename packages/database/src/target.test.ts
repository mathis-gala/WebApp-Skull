import { describe, expect, it, vi } from "vitest"

import { verifyDatabaseTarget, withVerifiedDatabaseTarget } from "./target.js"

const developmentTarget = {
  APP_ENV: "development",
  DATABASE_URL:
    "postgresql://webapp_skull:local-only@127.0.0.1:5433/webapp_skull",
}

describe("database target verification", () => {
  it.each([
    {
      ...developmentTarget,
      APP_ENV: "production",
    },
    {
      ...developmentTarget,
      DATABASE_URL:
        "postgresql://user:secret@database.example.com/webapp_skull",
    },
    {
      ...developmentTarget,
      DATABASE_URL:
        "postgresql://webapp_skull:local-only@127.0.0.1:5433/another_database",
    },
  ])("refuses a migration target before a connection is opened", (source) => {
    expect(() => verifyDatabaseTarget(source, "migrate")).toThrow(
      "Refusing database operation"
    )
  })

  it("accepts the expected loopback development database for migrations", () => {
    expect(verifyDatabaseTarget(developmentTarget, "migrate")).toMatchObject({
      databaseName: "webapp_skull",
      environment: "development",
    })
  })

  it("requires explicit fixture mode before seeding", () => {
    expect(() => verifyDatabaseTarget(developmentTarget, "seed")).toThrow(
      "fixture mode"
    )

    expect(
      verifyDatabaseTarget(
        { ...developmentTarget, DATABASE_FIXTURE_MODE: "auth" },
        "seed"
      )
    ).toMatchObject({ databaseName: "webapp_skull" })
  })

  it("requires an owned test run for the isolated test database", () => {
    const target = {
      APP_ENV: "test",
      DATABASE_URL:
        "postgresql://skull_auth_test:local-only@127.0.0.1:49152/skull_auth_test",
      DATABASE_FIXTURE_MODE: "auth",
    }

    expect(() => verifyDatabaseTarget(target, "seed")).toThrow("owned test")
    expect(
      verifyDatabaseTarget(
        { ...target, DATABASE_TEST_OWNED: "skull-code004-test-1234" },
        "seed"
      )
    ).toMatchObject({ databaseName: "skull_auth_test" })
  })

  it("refuses an unsafe target before opening a database connection", async () => {
    const openConnection = vi.fn(() => Promise.resolve())

    await expect(
      withVerifiedDatabaseTarget(
        {
          ...developmentTarget,
          DATABASE_URL:
            "postgresql://user:secret@database.example.com/webapp_skull",
        },
        "migrate",
        openConnection
      )
    ).rejects.toThrow("Refusing database operation")
    expect(openConnection).not.toHaveBeenCalled()
  })
})
