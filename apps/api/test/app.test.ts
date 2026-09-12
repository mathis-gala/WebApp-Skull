import { Controller, Get } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { Test } from "@nestjs/testing"
import request from "supertest"
import { afterEach, describe, it } from "vitest"

import { createApiApp } from "../src/app.js"
import {
  AUTH_SESSION_READER,
  AuthGuard,
} from "../src/infrastructure/auth/guard.js"
import type { INestApplication } from "@nestjs/common"

const openApps = new Set<INestApplication>()

afterEach(async () => {
  const apps = [...openApps]
  openApps.clear()
  await Promise.all(apps.map((app) => app.close()))
})

describe("API", () => {
  it("serves liveness through a real HTTP server", async () => {
    const app = await createApiApp({
      authHandler: (_request, response) => response.sendStatus(404),
      getSession: async () => null,
    })
    openApps.add(app)
    await app.listen(0, "127.0.0.1")

    await request(app.getHttpServer())
      .get("/health/live")
      .expect(200, { status: "ok" })
  })

  it("delegates auth routes to the Better Auth handler boundary", async () => {
    const app = await createApiApp({
      authHandler: (incoming, response) =>
        response.status(200).json({ path: incoming.originalUrl }),
      getSession: async () => null,
    })
    openApps.add(app)
    await app.listen(0, "127.0.0.1")

    await request(app.getHttpServer())
      .post("/api/auth/sign-up/email")
      .send({ email: "user@example.test" })
      .expect(200, { path: "/api/auth/sign-up/email" })
  })

  it("rejects protected Nest routes without a session", async () => {
    @Controller("protected")
    class ProtectedController {
      @Get()
      read() {
        return { ok: true }
      }
    }

    const module = await Test.createTestingModule({
      controllers: [ProtectedController],
      providers: [
        { provide: AUTH_SESSION_READER, useValue: async () => null },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile()
    const app = module.createNestApplication()
    openApps.add(app)
    await app.init()

    await request(app.getHttpServer()).get("/protected").expect(401)
  })
})
