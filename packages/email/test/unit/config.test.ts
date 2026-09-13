import { describe, expect, it } from "vitest"
import { getEmailConfig } from "../../src/config.js"

describe("email environment boundary", () => {
  it("refuses a production capture and hides supplied secrets", () => {
    expect(() =>
      getEmailConfig({
        APP_ENV: "production",
        EMAIL_MODE: "capture",
        SMTP_PASSWORD: "private-value",
      })
    ).toThrow("EMAIL_MODE")
    expect(() =>
      getEmailConfig({
        APP_ENV: "production",
        EMAIL_MODE: "capture",
        SMTP_PASSWORD: "private-value",
      })
    ).not.toThrow("private-value")
  })
})

it("keeps capture local and requires a staging allowlist before real SMTP", () => {
  expect(() =>
    getEmailConfig({ APP_ENV: "development", SMTP_HOST: "smtp.external.test" })
  ).toThrow("SMTP_HOST")
  expect(() =>
    getEmailConfig({ APP_ENV: "staging", EMAIL_MODE: "smtp" })
  ).toThrow("EMAIL_ALLOWED_RECIPIENTS")
  expect(getEmailConfig({ APP_ENV: "test" }).EMAIL_MODE).toBe("memory")
})
