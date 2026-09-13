import { z } from "zod"
import {
  invalid_email,
  password_length,
  name_length,
  password_mismatch,
} from "@workspace/i18n/messages"
import { authPasswordConstraints } from "@workspace/contracts/auth/constraints"
import { authFormConstraints } from "./auth-form.constraints"

export const emailSchema = z.object({ email: z.email(invalid_email()) })
const passwordLengthMessage = password_length({
  min: authPasswordConstraints.minLength,
  max: authPasswordConstraints.maxLength,
})
const password = z
  .string()
  .min(authPasswordConstraints.minLength, passwordLengthMessage)
  .max(authPasswordConstraints.maxLength, passwordLengthMessage)
export const signInSchema = emailSchema.extend({ password })
export const signUpSchema = signInSchema.extend({
  name: z
    .string()
    .trim()
    .min(
      authFormConstraints.userNameMinLength,
      name_length({ min: authFormConstraints.userNameMinLength })
    ),
})
export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: password_mismatch(),
  })
