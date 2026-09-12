import { Body, Controller, Post } from "@nestjs/common"
import { APP_FILTER, APP_PIPE } from "@nestjs/core"
import { Test } from "@nestjs/testing"
import express from "express"
import { ZodValidationPipe, createZodDto } from "nestjs-zod"
import request from "supertest"
import { z } from "zod"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createApiApp } from "../src/app.js"
import { HttpErrorFilter } from "../src/infrastructure/http/http-error.filter.js"
import { requestContext } from "../src/infrastructure/http/request-context.js"
import type { INestApplication } from "@nestjs/common"
import type { RequestHandler } from "express"
import type { ApiDependencies } from "../src/app.js"
import type {
  AuthSession,
  GetSession,
} from "../src/infrastructure/auth/session.js"

const openApps = new Set<INestApplication>()
const inertAuthHandler: RequestHandler = (_request, response) =>
  response.sendStatus(404)

const validationHandler = vi.fn()
const validationProbeSchema = z.object({ email: z.email() })

class ValidationProbeDto extends createZodDto(validationProbeSchema) {}

@Controller("test/validation")
class ValidationProbeController {
  @Post()
  validate(@Body() _body: ValidationProbeDto) {
    validationHandler()
    return { ok: true }
  }
}

type TestDependencies = Readonly<{
  authHandler?: RequestHandler
  getSession?: GetSession
}>

async function createTestApp(dependencies: TestDependencies = {}) {
  const apiDependencies: ApiDependencies = {
    authHandler: dependencies.authHandler ?? inertAuthHandler,
    getSession: dependencies.getSession ?? (() => Promise.resolve(null)),
  }
  const app = await createApiApp(apiDependencies)
  openApps.add(app)
  return app
}

async function createValidationTestApp() {
  const module = await Test.createTestingModule({
    controllers: [ValidationProbeController],
    providers: [
      { provide: APP_PIPE, useClass: ZodValidationPipe },
      { provide: APP_FILTER, useClass: HttpErrorFilter },
    ],
  }).compile()
  const app = module.createNestApplication()
  app.use(requestContext)
  app.use(express.json())
  openApps.add(app)
  return app
}

type SessionOverrides = Readonly<{
  email?: string
  emailVerified?: boolean
}>

function createSession(overrides: SessionOverrides = {}): AuthSession {
  return {
    user: {
      id: "user-1",
      name: "Ada Lovelace",
      email: overrides.email ?? "ada@example.test",
      emailVerified: overrides.emailVerified ?? true,
    },
    session: { id: "session-1" },
  }
}

afterEach(async () => {
  validationHandler.mockReset()
  const apps = [...openApps]
  openApps.clear()
  await Promise.all(apps.map((app) => app.close()))
})

describe("API", () => {
  it("serves liveness through a real HTTP server", async () => {
    const app = await createTestApp()
    await app.listen(0, "127.0.0.1")

    await request(app.getHttpServer())
      .get("/health/live")
      .expect(200, { status: "ok" })
  })

  it("delegates auth routes to the Better Auth handler boundary", async () => {
    const app = await createTestApp({
      authHandler: (incoming, response) =>
        response.status(200).json({ path: incoming.originalUrl }),
    })
    await app.listen(0, "127.0.0.1")

    await request(app.getHttpServer())
      .post("/api/auth/sign-up/email")
      .send({ email: "user@example.test" })
      .expect(200, { path: "/api/auth/sign-up/email" })
  })

  it("rejects protected Nest routes without a session", async () => {
    const app = await createTestApp()
    await app.init()

    const response = await request(app.getHttpServer())
      .get("/api/me")
      .expect(401)

    expect(response.body).toEqual({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      requestId: response.headers["x-request-id"],
    })
  })

  it("returns a cleaned validation error before a controller handles invalid input", async () => {
    const app = await createValidationTestApp()
    await app.init()

    const response = await request(app.getHttpServer())
      .post("/test/validation")
      .send({ email: "private invalid email" })
      .expect(400)

    expect(validationHandler).not.toHaveBeenCalled()
    expect(response.body).toEqual({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      requestId: response.headers["x-request-id"],
      details: [{ code: "invalid_format", path: "email" }],
    })
    expect(JSON.stringify(response.body)).not.toContain("private invalid email")
  })

  it("returns the authenticated identity from /api/me", async () => {
    const app = await createTestApp({
      getSession: () => Promise.resolve(createSession()),
    })
    await app.init()

    await request(app.getHttpServer()).get("/api/me").expect(200, {
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.test",
      emailVerified: true,
    })
  })

  it("rejects a session whose email identity is not verified", async () => {
    const app = await createTestApp({
      getSession: () =>
        Promise.resolve(createSession({ emailVerified: false })),
    })
    await app.init()

    await request(app.getHttpServer()).get("/api/me").expect(403)
  })

  it("does not expose an invalid response or its validation details", async () => {
    const app = await createTestApp({
      getSession: () =>
        Promise.resolve(createSession({ email: "not-an-email" })),
    })
    await app.init()

    const response = await request(app.getHttpServer())
      .get("/api/me")
      .expect(500)

    expect(response.body).toEqual({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
      requestId: response.headers["x-request-id"],
    })
    expect(JSON.stringify(response.body)).not.toContain("not-an-email")
  })
})
