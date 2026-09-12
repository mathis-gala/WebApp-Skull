import { createFileRoute, Link } from "@tanstack/react-router"
import {
  sign_in_title,
  auth_description,
  forgot_password,
  sign_up,
  resend_verification,
} from "@workspace/i18n/messages"
import { AuthPanel } from "@/features/auth/components/auth-panel"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { privateHead } from "@/lib/seo/private-head"
import { signInSearchSchema } from "@/features/auth/schemas/search"

export const Route = createFileRoute("/connexion")({
  validateSearch: signInSearchSchema,
  head: () => privateHead(sign_in_title(), auth_description()),
  component: Page,
})
function Page() {
  const { redirect } = Route.useSearch()
  return (
    <AuthPanel title={sign_in_title()} description={auth_description()}>
      <SignInForm redirect={redirect} />
      <nav className="flex flex-col gap-3 text-sm underline underline-offset-4">
        <Link to="/mot-de-passe-oublie">{forgot_password()}</Link>
        <Link to="/inscription">{sign_up()}</Link>
        <Link to="/verification-email">{resend_verification()}</Link>
      </nav>
    </AuthPanel>
  )
}
