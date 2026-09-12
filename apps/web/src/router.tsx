import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"

import { createQueryClient } from "./lib/query/query-client"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = createQueryClient()
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({
    queryClient,
    router,
  })

  return router
}

export type RouterContext = {
  queryClient: ReturnType<typeof createQueryClient>
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
