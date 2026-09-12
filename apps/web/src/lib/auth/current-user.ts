import { queryOptions } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"

import { apiClient } from "../api/client"

export class AuthenticationRequiredError extends Error {}

export const currentUserQueryOptions = queryOptions({
  queryKey: ["auth", "current-user"],
  queryFn: async ({ signal }) => {
    const { data, response } = await apiClient.GET("/api/me", { signal })

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationRequiredError("Authentication required")
    }

    if (!response.ok || !data) {
      throw new Error("Unable to load the authenticated user")
    }

    return data
  },
  retry: false,
  staleTime: 30_000,
})

export function loadCurrentUserForProtectedRoute(queryClient: QueryClient) {
  return queryClient.fetchQuery({
    ...currentUserQueryOptions,
    staleTime: 0,
  })
}

export async function clearPrivateCache(queryClient: QueryClient) {
  await queryClient.cancelQueries()
  queryClient.clear()
}
