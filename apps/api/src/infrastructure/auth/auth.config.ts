const MINUTE_IN_SECONDS = 60
const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS
const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS

export const authConfig = Object.freeze({
  session: Object.freeze({
    expiresInSeconds: 7 * DAY_IN_SECONDS, // 7 days
    updateAgeSeconds: DAY_IN_SECONDS, // 1 day
  }),
  rateLimit: Object.freeze({
    windowSeconds: MINUTE_IN_SECONDS, // 1 minute
    defaultMaxRequests: 100,
    sensitiveMaxRequests: 5,
  }),
  emailVerificationExpiresInSeconds: DAY_IN_SECONDS, // 1 day
  resetPasswordTokenExpiresInSeconds: HOUR_IN_SECONDS, // 1 hour
})
