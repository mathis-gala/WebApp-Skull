import "reflect-metadata"

import { Module } from "@nestjs/common"
import { APP_GUARD, NestFactory } from "@nestjs/core"
import cors from "cors"
import express from "express"

import { AUTH_SESSION_READER, AuthGuard } from "./infrastructure/auth/guard.js"
import { HealthController } from "./modules/health/health.controller.js"
import type { INestApplication } from "@nestjs/common"
import type { RequestHandler } from "express"
import type { GetSession } from "./infrastructure/auth/session.js"

export type ApiDependencies = Readonly<{
  authHandler: RequestHandler
  getSession: GetSession
  allowedOrigin?: string
}>

export async function createApiApp(
  dependencies: ApiDependencies
): Promise<INestApplication> {
  @Module({
    controllers: [HealthController],
    providers: [
      { provide: AUTH_SESSION_READER, useValue: dependencies.getSession },
      { provide: APP_GUARD, useClass: AuthGuard },
    ],
  })
  class AppModule {}

  const app = await NestFactory.create(AppModule, { bodyParser: false })
  const expressApp = app.getHttpAdapter().getInstance()

  expressApp.use(
    cors({
      origin: dependencies.allowedOrigin ?? "http://localhost:3000",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  )
  expressApp.use("/api/auth", dependencies.authHandler)
  expressApp.use(express.json())

  return app
}
