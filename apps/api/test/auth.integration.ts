import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { setTimeout as delay } from "node:timers/promises"
import { expect as browserExpect, chromium } from "@playwright/test"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createDatabase, schema } from "@workspace/database"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { toNodeHandler } from "better-auth/node"
import request from "supertest"
import { createSmtpSender, getEmailConfig } from "@workspace/email"
import { createAuth } from "../src/infrastructure/auth/auth.js"
import { createApiApp } from "../src/app.js"
import { getEnv } from "../src/config/env.js"
import { AuthEmailDispatcher } from "../src/infrastructure/email/auth-email-dispatcher.js"
import type { INestApplication } from "@nestjs/common"

const databaseUrl = process.env.AUTH_TEST_DATABASE_URL
if (
  !databaseUrl ||
  !process.env.AUTH_TEST_OWNED?.startsWith("skull-auth-test-")
)
  throw new Error("Use pnpm test:integration: isolated owned services required")
const target = new URL(databaseUrl)
if (target.hostname !== "127.0.0.1" || target.pathname !== "/skull_auth_test")
  throw new Error("Refusing unverified test database")
const database = createDatabase(databaseUrl)
async function freePort() {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("No test port")
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  )
  return address.port
}
const webPort = await freePort()
const apiPort = await freePort()
const origin = `http://127.0.0.1:${webPort}`
const api = `http://127.0.0.1:${apiPort}`
const email = "verified@example.test"
const password = "Local-Only-Auth-2026!"
const events: Array<string> = []
const sender = createSmtpSender(
  getEmailConfig({
    APP_ENV: "test",
    EMAIL_MODE: "capture",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: process.env.AUTH_TEST_SMTP_PORT,
  })
)
const dispatcher = new AuthEmailDispatcher(sender, (event) => {
  events.push(event.event)
})
const auth = createAuth(
  database.db,
  getEnv({
    APP_ENV: "test",
    BETTER_AUTH_URL: api,
    WEB_URL: origin,
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: "isolated-test-secret-not-for-production-2026",
  }),
  dispatcher
)
let app: INestApplication
let cookie = ""
let verificationUrl = ""

function cookieHeader(value: string | Array<string> | undefined) {
  if (!value) throw new Error("Missing session cookie")
  return Array.isArray(value) ? value.join("; ") : value
}

async function latestMailUrl() {
  await dispatcher.drain()
  expect(events.at(-1)).toBe("email.accepted")
  const listing = await fetch(
    `${process.env.AUTH_TEST_MAILPIT_URL}/api/v1/messages`
  ).then((response) => response.json())
  const message = await fetch(
    `${process.env.AUTH_TEST_MAILPIT_URL}/api/v1/message/${listing.messages[0].ID}`
  ).then((response) => response.json())
  const match = message.Text.match(/https?:\/\/[^\s<>]+/)
  if (!match) throw new Error("No action link in captured mail")
  return match[0]
}
const post = (path: string, body: object) =>
  request(app.getHttpServer())
    .post(`/api/auth${path}`)
    .set("Origin", origin)
    .send(body)

beforeAll(async () => {
  await migrate(database.db, {
    migrationsFolder: "../../packages/database/drizzle",
  })
  app = await createApiApp({
    authHandler: toNodeHandler(auth),
    getSession: (headers) => auth.api.getSession({ headers }),
    allowedOrigin: origin,
  })
  await app.listen(apiPort, "127.0.0.1")
})
afterAll(async () => {
  await app.close()
  await dispatcher.close()
  await database.close()
})

describe("real HTTP auth with isolated PostgreSQL and Mailpit", () => {
  it("requires email verification, captures French mail, then requires explicit login", async () => {
    const signup = await post("/sign-up/email", {
      email,
      password,
      name: "Camille",
      callbackURL: `${origin}/adresse-confirmee`,
    })
    expect(signup.status).toBe(200)
    expect(signup.headers["set-cookie"]).toBeUndefined()
    expect((await post("/sign-in/email", { email, password })).status).toBe(403)
    verificationUrl = await latestMailUrl()
    const url = new URL(verificationUrl)
    const verification = await request(app.getHttpServer()).get(
      `${url.pathname}${url.search}`
    )
    expect(verification.status).toBe(302)
    expect(verification.headers.location).toBe(`${origin}/adresse-confirmee`)
    const login = await post("/sign-in/email", { email, password })
    expect(login.status).toBe(200)
    cookie = cookieHeader(login.headers["set-cookie"])
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("SameSite=Lax")
    expect(
      (await request(app.getHttpServer()).get("/api/me").set("Cookie", cookie))
        .status
    ).toBe(200)
  })
  it("keeps email requests non-enumerating and rejects external callback URLs", async () => {
    const known = await post("/request-password-reset", {
      email,
      redirectTo: `${origin}/nouveau-mot-de-passe`,
    })
    const unknown = await post("/request-password-reset", {
      email: "unknown@example.test",
      redirectTo: `${origin}/nouveau-mot-de-passe`,
    })
    expect(known.status).toBe(unknown.status)
    expect(known.body).toEqual(unknown.body)
    const knownResend = await post("/send-verification-email", { email })
    const unknownResend = await post("/send-verification-email", {
      email: "unknown@example.test",
    })
    expect(knownResend.status).toBe(unknownResend.status)
    expect(knownResend.body).toEqual(unknownResend.body)
    expect(
      (
        await post("/request-password-reset", {
          email,
          redirectTo: "https://evil.test/reset",
        })
      ).status
    ).toBe(403)
  })
  it("resets the password once and revokes old sessions", async () => {
    await dispatcher.drain()
    const resetUrl = new URL(await latestMailUrl())
    const redirect = await request(app.getHttpServer()).get(
      `${resetUrl.pathname}${resetUrl.search}`
    )
    const token = new URL(
      redirect.headers.location ?? "http://invalid.test"
    ).searchParams.get("token")
    expect(token).toBeTruthy()
    const nextPassword = "New-Local-Only-2026!"
    expect(
      (await post("/reset-password", { token, newPassword: nextPassword }))
        .status
    ).toBe(200)
    expect(
      (await post("/reset-password", { token, newPassword: password })).status
    ).toBe(400)
    expect(
      (await request(app.getHttpServer()).get("/api/me").set("Cookie", cookie))
        .status
    ).toBe(401)
    expect((await post("/sign-in/email", { email, password })).status).toBe(401)
    const login = await post("/sign-in/email", {
      email,
      password: nextPassword,
    })
    expect(login.status).toBe(200)
    cookie = cookieHeader(login.headers["set-cookie"])
    expect((await post("/sign-out", {}).set("Cookie", cookie)).status).toBe(200)
    expect(
      (await request(app.getHttpServer()).get("/api/me").set("Cookie", cookie))
        .status
    ).toBe(401)
  })
  it("rejects expired reset tokens", async () => {
    await post("/request-password-reset", {
      email,
      redirectTo: `${origin}/nouveau-mot-de-passe`,
    })
    const resetUrl = new URL(await latestMailUrl())
    await database.db
      .update(schema.verification)
      .set({ expiresAt: new Date(Date.now() - 1000) })
    expect(
      (
        await request(app.getHttpServer()).get(
          `${resetUrl.pathname}${resetUrl.search}`
        )
      ).headers.location
    ).toContain("error=")
  })
  it("rejects verification at its expiry boundary", async () => {
    const url = new URL(verificationUrl)
    const token = url.searchParams.get("token")
    const payload = token?.split(".")[1]
    if (!payload) throw new Error("Missing test verification token")
    const expiration = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ).exp
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(expiration * 1000)
    try {
      const response = await request(app.getHttpServer()).get(
        `${url.pathname}${url.search}`
      )
      expect(response.status).toBe(302)
      expect(response.headers.location).toContain("error=")
    } finally {
      vi.useRealTimers()
    }
  })
  it("rejects expired sessions and hostile origins", async () => {
    await database.db
      .update(schema.rateLimit)
      .set({ lastRequest: Date.now() - 60000 })
    const login = await post("/sign-in/email", {
      email,
      password: "New-Local-Only-2026!",
    })
    expect(login.status).toBe(200)
    const sessionCookie = cookieHeader(login.headers["set-cookie"])
    expect(
      (
        await post("/sign-out", {})
          .set("Cookie", sessionCookie)
          .set("Origin", "https://evil.test")
      ).status
    ).toBe(403)
    await database.db
      .update(schema.session)
      .set({ expiresAt: new Date(Date.now() - 1000) })
    expect(
      (
        await request(app.getHttpServer())
          .get("/api/me")
          .set("Cookie", sessionCookie)
      ).status
    ).toBe(401)
  })
  it("rate limits parallel attempts even when forwarded client headers change", async () => {
    await database.db
      .update(schema.rateLimit)
      .set({ lastRequest: Date.now() - 60000 })
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        post("/send-verification-email", { email: "unknown@example.test" })
          .set("x-forwarded-for", `192.0.2.${index}`)
          .set("x-auth-client-ip", `198.51.100.${index}`)
      )
    )
    expect(
      responses.filter((response) => response.status === 429).length
    ).toBeGreaterThanOrEqual(3)
    expect(responses.filter((response) => response.status === 200).length).toBe(
      5
    )
    await database.db
      .update(schema.rateLimit)
      .set({ lastRequest: Date.now() - 60000 })
    expect(
      (
        await post("/send-verification-email", {
          email: "unknown@example.test",
        })
      ).status
    ).toBe(200)
  })
})

it("completes French signup, verification, reset and logout in a mobile browser", async () => {
  await database.db
    .update(schema.rateLimit)
    .set({ lastRequest: Date.now() - 60000 })
  const browser = await chromium.launch()
  const web = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--config",
      "vite.e2e.config.ts",
      "--port",
      String(webPort),
    ],
    {
      cwd: "../web",
      env: { ...process.env, VITE_API_URL: api },
      stdio: "ignore",
    }
  )
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        ready = (await fetch(`${origin}/connexion`)).ok
      } catch {
        /* The owned Vite process is still starting. */
      }
      if (ready) break
      if (web.exitCode !== null)
        throw new Error("Test web server exited before startup")
      await delay(200)
    }
    expect(ready).toBe(true)
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    })
    const browserErrors: Array<string> = []
    page.on("pageerror", (error) => {
      browserErrors.push(error.message)
    })
    await page.goto(`${origin}/inscription`)
    await browserExpect(page.getByLabel("Nom", { exact: true })).toBeEnabled()
    expect(browserErrors).toEqual([])
    await browserExpect(page.locator("html")).toHaveAttribute("lang", "fr")
    await browserExpect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow"
    )
    await page.screenshot({
      path: "../../output/playwright/auth-inscription-mobile.png",
      fullPage: true,
    })
    await page.getByLabel("Nom", { exact: true }).fill("Élodie")
    await page.getByLabel("Adresse email").fill("browser@example.test")
    await page.getByLabel("Mot de passe", { exact: true }).fill(password)
    await page.getByRole("button", { name: "Créer mon compte" }).click()
    await browserExpect(page).toHaveURL(`${origin}/verification-email`)
    await page.goto(await latestMailUrl())
    await browserExpect(
      page.getByRole("heading", { name: "Adresse email confirmée" })
    ).toBeVisible()
    await page.getByRole("link", { name: "Revenir à la connexion" }).click()
    await page.getByLabel("Adresse email").fill("browser@example.test")
    await page.getByLabel("Mot de passe", { exact: true }).fill(password)
    await page.getByRole("button", { name: "Se connecter" }).click()
    await browserExpect(
      page.getByRole("heading", { name: "Bonjour, Élodie" })
    ).toBeVisible()
    await page.screenshot({
      path: "../../output/playwright/auth-home-mobile.png",
      fullPage: true,
    })
    await page.route("**/api/auth/sign-out", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "SERVICE_UNAVAILABLE" }),
      })
    )
    await page.getByRole("button", { name: "Se déconnecter" }).click()
    await browserExpect(
      page.getByRole("heading", { name: "Bonjour, Élodie" })
    ).toBeVisible()
    await browserExpect(
      page.locator("[data-sonner-toast][data-type='error']")
    ).toHaveCount(1)
    await page.unroute("**/api/auth/sign-out")
    await page.getByRole("button", { name: "Se déconnecter" }).click()
    await browserExpect(page).toHaveURL(
      (url) =>
        url.origin === origin &&
        url.pathname === "/connexion" &&
        (url.search === "" || url.searchParams.get("redirect") === "/")
    )
    await page.screenshot({
      path: "../../output/playwright/auth-connexion-mobile.png",
      fullPage: true,
    })
    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click()
    await browserExpect(page).toHaveURL(`${origin}/mot-de-passe-oublie`)
    await browserExpect(
      page.getByRole("heading", { name: "Retrouver votre accès" })
    ).toBeVisible()
    await page.getByLabel("Adresse email").fill("browser@example.test")
    await page.getByRole("button", { name: "Demander un lien" }).click()
    await browserExpect(page.locator("main")).toContainText("Demande reçue")
    await page.goto(await latestMailUrl())
    await page
      .getByLabel("Nouveau mot de passe", { exact: true })
      .fill("Browser-New-Password-2026!")
    await page
      .getByLabel("Confirmer le mot de passe")
      .fill("Browser-New-Password-2026!")
    await page
      .getByRole("button", { name: "Enregistrer le mot de passe" })
      .click()
    await browserExpect(page).toHaveURL(
      (url) =>
        url.origin === origin &&
        url.pathname === "/connexion" &&
        (url.search === "" || url.searchParams.get("redirect") === "/")
    )
    await page.getByLabel("Adresse email").fill("browser@example.test")
    await page
      .getByLabel("Mot de passe", { exact: true })
      .fill("Browser-New-Password-2026!")
    await page.getByRole("button", { name: "Se connecter" }).click()
    await browserExpect(
      page.getByRole("heading", { name: "Bonjour, Élodie" })
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
  } finally {
    await browser.close()
    web.kill("SIGTERM")
  }
}, 60000)
