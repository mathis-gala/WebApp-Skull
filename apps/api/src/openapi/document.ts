import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { projectConfig } from "@workspace/config/project"
import { cleanupOpenApiDoc } from "nestjs-zod"
import type { INestApplication } from "@nestjs/common"

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(`${projectConfig.name} API`)
    .setDescription(projectConfig.description)
    .setVersion(projectConfig.api.version)
    .addCookieAuth(projectConfig.auth.sessionCookieName)
    .build()

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config), {
    version: "3.1",
  })
}

export function setupOpenApi(app: INestApplication) {
  SwaggerModule.setup(
    projectConfig.api.docsPath,
    app,
    createOpenApiDocument(app)
  )
}
