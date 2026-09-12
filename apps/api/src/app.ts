import "reflect-metadata"

import { Module } from "@nestjs/common"
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  NestFactory,
} from "@nestjs/core"
import cors from "cors"
import express from "express"
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod"

import { AUTH_SESSION_READER, AuthGuard } from "./infrastructure/auth/guard.js"
import { HttpErrorFilter } from "./infrastructure/http/http-error.filter.js"
import { requestContext } from "./infrastructure/http/request-context.js"
import { HealthController } from "./modules/health/health.controller.js"
import { IdentityController } from "./modules/identity/identity.controller.js"
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
    controllers: [HealthController, IdentityController],
    providers: [
      { provide: AUTH_SESSION_READER, useValue: dependencies.getSession },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_PIPE, useClass: ZodValidationPipe },
      { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      { provide: APP_FILTER, useClass: HttpErrorFilter },
    ],
  })
  class AppModule {}

  const app = await NestFactory.create(AppModule, { bodyParser: false })
  const expressApp = app.getHttpAdapter().getInstance()

  expressApp.use(requestContext)
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
