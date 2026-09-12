import { schema } from "@workspace/database"
import { projectConfig } from "@workspace/config/project"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { getEnv } from "../../config/env.js"
import { database } from "../database.js"
import type { Database } from "@workspace/database"
import type { ApiEnv } from "../../config/env.js"

export function createAuth(db: Database, env: ApiEnv) {
  return betterAuth({
    appName: projectConfig.name,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
  })
}

export const auth = createAuth(database.db, getEnv())
