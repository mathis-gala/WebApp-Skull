import { z } from "zod"

const envSchema = z.object({
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.url(),
  WEB_URL: z.url(),
})

export type ApiEnv = z.infer<typeof envSchema>

export function getEnv(
  source: Record<string, string | undefined> = process.env
) {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    throw new Error(`Invalid API environment: ${z.prettifyError(result.error)}`)
  }

  return result.data
}
