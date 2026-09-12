import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { cleanupOpenApiDoc } from "nestjs-zod"
import type { INestApplication } from "@nestjs/common"

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("WebApp Skull API")
    .setDescription("Application HTTP API")
    .setVersion("1.0.0")
    .addCookieAuth("better-auth.session_token")
    .build()

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config), {
    version: "3.1",
  })
}

export function setupOpenApi(app: INestApplication) {
  SwaggerModule.setup("docs", app, createOpenApiDocument(app))
}
