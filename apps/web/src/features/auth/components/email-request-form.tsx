import { useHydrated } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { FieldError, FieldGroup } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  email_label,
  resend_verification,
  send_reset,
  email_request_received,
} from "@workspace/i18n/messages"
import type { FormEvent } from "react"
import { useEmailRequestForm } from "../hooks/use-email-request-form"
import { AuthInput } from "./auth-input"

export function EmailRequestForm({ kind }: { kind: "verification" | "reset" }) {
  const hydrated = useHydrated()
  const { form, serverError, received } = useEmailRequestForm(kind)
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }
  const action = kind === "verification" ? resend_verification() : send_reset()
  return (
    <form method="post" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={!hydrated} className="min-w-0">
        <FieldGroup>
          <form.Field name="email">
            {(field) => (
              <AuthInput
                name={field.name}
                label={email_label()}
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                errors={field.state.meta.errors}
              />
            )}
          </form.Field>
          {serverError && <FieldError role="alert">{serverError}</FieldError>}
          {received && (
            <p role="status" className="text-sm text-muted-foreground">
              {email_request_received()}
            </p>
          )}
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(pending) => (
              <Button type="submit" disabled={pending} className="min-h-11">
                {pending && <Spinner />}
                {action}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </fieldset>
    </form>
  )
}
