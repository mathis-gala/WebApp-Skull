import { createFileRoute, redirect } from "@tanstack/react-router"
import { signInSearchSchema } from "@/features/auth/schemas/search"

export const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/connexion", search, replace: true })
  },
})
