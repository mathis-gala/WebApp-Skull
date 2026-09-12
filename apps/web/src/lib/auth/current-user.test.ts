import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AuthenticationRequiredError,
  clearPrivateCache,
  loadCurrentUserForProtectedRoute,
} from "./current-user"

const { getCurrentUser } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("../api/client", () => ({
  apiClient: { GET: getCurrentUser },
}))

afterEach(() => {
  getCurrentUser.mockReset()
})

describe("identity transitions", () => {
  it("checks a fresh cached identity with the API before entering a protected route", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["auth", "current-user"], {
      id: "revoked-user",
      name: "Revoked user",
      email: "revoked@example.test",
      emailVerified: true,
    })
    getCurrentUser.mockResolvedValue({
      response: new Response(null, { status: 401 }),
    })

    await expect(
      loadCurrentUserForProtectedRoute(queryClient)
    ).rejects.toBeInstanceOf(AuthenticationRequiredError)

    expect(getCurrentUser).toHaveBeenCalledOnce()
  })

  it("cancels requests and removes private data before another identity can be shown", async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(["auth", "current-user"], {
      id: "user-a",
      email: "a@example.test",
    })
    queryClient.setQueryData(["private", "dashboard"], {
      ownerId: "user-a",
    })
    const pendingRequest = queryClient.fetchQuery({
      queryKey: ["private", "in-flight"],
      queryFn: ({ signal }) =>
        new Promise((resolve) => {
          signal.addEventListener("abort", () => resolve("cancelled"))
        }),
    })
    const pendingOutcome = pendingRequest.catch(() => undefined)

    await clearPrivateCache(queryClient)
    await pendingOutcome

    expect(queryClient.getQueryCache().getAll()).toEqual([])
  })
})
