import { toNodeHandler } from "better-auth/node"

import { createApiApp } from "./app.js"
import { getEnv } from "./config/env.js"
import { auth } from "./infrastructure/auth/auth.js"

const env = getEnv()
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
      },
      session: {
        id: session.session.id,
      },
    }
  },
  allowedOrigin: env.WEB_URL,
})

await app.listen(env.API_PORT)
console.log(`API listening on http://localhost:${env.API_PORT}`)

const shutdown = async () => {
  await app.close()
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
