import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  AuthenticationRequiredError,
  loadCurrentUserForProtectedRoute,
} from "@/lib/auth/current-user"

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    try {
      return {
        currentUser: await loadCurrentUserForProtectedRoute(
          context.queryClient
        ),
      }
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) {
        throw redirect({ to: "/sign-in", search: { redirect: "/" } })
      }

      throw error
    }
  },
  component: HomePage,
})

function HomePage() {
  const { currentUser } = Route.useRouteContext()

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl items-center px-4 py-12 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl">
            Welcome, {currentUser.name}
          </CardTitle>
          <CardDescription>
            Your session is active and the API confirmed your identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
        </CardContent>
      </Card>
    </section>
  )
}
