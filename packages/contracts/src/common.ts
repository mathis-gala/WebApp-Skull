import { z } from "zod"

export const httpStatus = Object.freeze({
  unauthorized: 401,
  forbidden: 403,
})

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  details: z.unknown().optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
