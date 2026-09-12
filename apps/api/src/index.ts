import { toNodeHandler } from "better-auth/node"

import { createDatabase } from "@workspace/database"
import {
  MemoryEmailSender,
  createSmtpSender,
  getEmailConfig,
} from "@workspace/email"
import { createApiApp } from "./app.js"
import { getEnv } from "./config/env.js"
import { createAuth } from "./infrastructure/auth/auth.js"
import { AuthEmailDispatcher } from "./infrastructure/email/auth-email-dispatcher.js"
import { setupOpenApi } from "./openapi/document.js"

const env = getEnv()
const database = createDatabase(env.DATABASE_URL)
const emailConfig = getEmailConfig(process.env)
const sender =
  emailConfig.EMAIL_MODE === "memory"
    ? new MemoryEmailSender()
    : createSmtpSender(emailConfig)
const emails = new AuthEmailDispatcher(sender, (event) => {
  console.log(JSON.stringify(event))
})
const auth = createAuth(database.db, env, emails)
const app = await createApiApp({
  authHandler: toNodeHandler(auth),
  getSession: async (headers) => {
    const session = await auth.api.getSession({ headers })

    if (!session) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.session.id,
      },
    }
  },
  allowedOrigin: env.WEB_URL,
})

if (process.env.NODE_ENV !== "production") setupOpenApi(app)

await app.listen(env.API_PORT)
console.log(`API listening on http://localhost:${env.API_PORT}`)

const shutdown = async () => {
  await app.close()
  await emails.close()
  await database.close()
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
