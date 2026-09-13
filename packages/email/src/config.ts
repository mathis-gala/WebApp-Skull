import { z } from "zod"

const schema = z.object({
  APP_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  EMAIL_MODE: z.enum(["capture", "memory", "smtp"]).optional(),
  EMAIL_FROM: z.email().default("no-reply@example.test"),
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_ALLOWED_RECIPIENTS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((address) => address.trim().toLowerCase())
        .filter(Boolean)
    )
    .pipe(z.array(z.email())),
})

export function getEmailConfig(source: Record<string, string | undefined>) {
  const result = schema.safeParse(source)
  if (!result.success)
    throw new Error(
      `Invalid email environment: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`
    )
  const config = result.data
  let mode = config.EMAIL_MODE
  if (!mode) {
    mode = "capture"
    if (config.APP_ENV === "test") mode = "memory"
    if (config.APP_ENV === "production") mode = "smtp"
  }
  if (config.APP_ENV === "production") {
    if (mode !== "smtp")
      throw new Error("Invalid email environment: EMAIL_MODE")
    if (
      !source.SMTP_HOST ||
      !source.EMAIL_FROM ||
      !config.SMTP_USER ||
      !config.SMTP_PASSWORD
    )
      throw new Error(
        "Invalid email environment: SMTP_HOST, EMAIL_FROM, SMTP_USER, SMTP_PASSWORD required"
      )
  }
  if (mode === "memory" && config.APP_ENV !== "test")
    throw new Error(
      "Invalid email environment: EMAIL_MODE memory requires APP_ENV test"
    )
  if (mode === "smtp" && ["development", "test"].includes(config.APP_ENV))
    throw new Error(
      "Invalid email environment: EMAIL_MODE smtp forbidden in development/test"
    )
  if (
    mode === "capture" &&
    !["localhost", "127.0.0.1", "::1", "mailpit"].includes(config.SMTP_HOST)
  )
    throw new Error(
      "Invalid email environment: SMTP_HOST capture must be local Mailpit"
    )
  if (
    mode === "smtp" &&
    config.APP_ENV === "staging" &&
    !config.EMAIL_ALLOWED_RECIPIENTS.length
  )
    throw new Error(
      "Invalid email environment: EMAIL_ALLOWED_RECIPIENTS required"
    )
  return { ...config, EMAIL_MODE: mode }
}

export type EmailConfig = ReturnType<typeof getEmailConfig>
