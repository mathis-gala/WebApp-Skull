import { expect, it } from "vitest"
import { getSafeInternalRedirect } from "./redirect"

it.each([
  "https://evil.test",
  "//evil.test",
  "/\\evil.test",
  "/%2f%2fevil.test",
  "/%255cevil.test",
  "/\nevil.test",
])("rejects ambiguous or external return URL %s", (value) => {
  expect(getSafeInternalRedirect(value)).toBe("/")
})
it("preserves normalized internal navigation", () => {
  expect(getSafeInternalRedirect("/compte/../?section=profil#nom")).toBe(
    "/?section=profil#nom"
  )
})
