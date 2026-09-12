import { createAuthClient } from "better-auth/react"

import { API_URL } from "../api/config"

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: "include",
  },
})
