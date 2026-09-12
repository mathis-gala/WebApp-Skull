import { z } from "zod"
import { getSafeRedirect } from "@/lib/auth/redirect"

export const signInSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined).transform(getSafeRedirect),
})
export const tokenSearchSchema = z.object({
  token: z.string().max(4096).optional().catch(undefined),
  error: z.string().optional().catch(undefined),
})
