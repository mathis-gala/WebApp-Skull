import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ArrowRightIcon } from "lucide-react"

import { authClient } from "@/lib/auth/auth-client"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  const session = authClient.useSession()

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl items-center px-4 py-12 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl">
            {session.data ? `Welcome, ${session.data.user.name}` : "Welcome"}
          </CardTitle>
          <CardDescription>
            {session.data
              ? "Your session is active."
              : "Sign in or create an account to continue."}
          </CardDescription>
        </CardHeader>
        {!session.data && (
          <CardContent>
            <Button asChild>
              <Link to="/sign-in">
                Continue <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </section>
  )
}
