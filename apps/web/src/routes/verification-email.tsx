import { createFileRoute, Link } from "@tanstack/react-router"
import {
  verification_title,
  verification_description,
  back_sign_in,
} from "@workspace/i18n/messages"
import { AuthPanel } from "@/features/auth/components/auth-panel"
import { EmailRequestForm } from "@/features/auth/components/email-request-form"
import { privateHead } from "@/lib/seo/private-head"

export const Route = createFileRoute("/verification-email")({
  head: () => privateHead(verification_title(), verification_description()),
  component: Page,
})
function Page() {
  return (
    <AuthPanel
      title={verification_title()}
      description={verification_description()}
    >
      <EmailRequestForm kind="verification" />
      <nav className="flex flex-col gap-3 text-sm underline underline-offset-4">
        <Link to="/connexion">{back_sign_in()}</Link>
      </nav>
    </AuthPanel>
  )
}
