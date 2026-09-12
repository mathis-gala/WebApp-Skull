import { schema } from "@workspace/database"
import { authPasswordConstraints } from "@workspace/contracts/auth/constraints"
import projectConfig from "@workspace/config/project" with { type: "json" }
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { createRateLimitStore } from "./rate-limit-store.js"
import type { Database } from "@workspace/database"
import type { ApiEnv } from "../../config/env.js"

import type { AuthEmailDispatcher } from "../email/auth-email-dispatcher.js"

export function createAuth(
  db: Database,
  env: ApiEnv,
  emails: AuthEmailDispatcher
) {
  return betterAuth({
    appName: projectConfig.name,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    logger: {
      log: (level) => {
        console.error(JSON.stringify({ event: "auth.provider", level }))
      },
    },
    advanced: {
      disableOriginCheck: false,
      disableCSRFCheck: false,
      useSecureCookies: ["staging", "production"].includes(env.APP_ENV),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
      ipAddress: { ipAddressHeaders: ["x-auth-client-ip"] },
    },
    session: { expiresIn: 7 * 86400, updateAge: 86400 },
    rateLimit: {
      enabled: true,
      storage: "database",
      customStorage: createRateLimitStore(db, 60),
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/send-verification-email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 5 },
        "/reset-password": { window: 60, max: 5 },
      },
    },
    emailVerification: {
      expiresIn: 86400,
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      sendVerificationEmail: ({ user, url }) => {
        emails.enqueue({
          kind: "verification",
          to: user.email,
          url,
          locale: "fr",
        })
        return Promise.resolve()
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: authPasswordConstraints.minLength,
      maxPasswordLength: authPasswordConstraints.maxLength,
      requireEmailVerification: true,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) => {
        emails.enqueue({ kind: "reset", to: user.email, url, locale: "fr" })
        return Promise.resolve()
      },
    },
  })
}
