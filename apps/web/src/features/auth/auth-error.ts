import {
  invalid_credentials,
  email_not_verified,
  rate_limited,
  invalid_link,
  request_error,
} from "@workspace/i18n/messages"

export function authErrorMessage(error: { code?: string; status?: number }) {
  if (error.status === 429) return rate_limited()
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return invalid_credentials()
    case "EMAIL_NOT_VERIFIED":
      return email_not_verified()
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return invalid_link()
    default:
      return request_error()
  }
}
