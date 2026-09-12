import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { network_error } from "@workspace/i18n/messages"
import { authClient } from "@/lib/auth/auth-client"
import { emailSchema } from "../schemas/auth-form"
import { authErrorMessage } from "../auth-error"

export function useEmailRequestForm(kind: "verification" | "reset") {
  const [serverError, setServerError] = useState<string>()
  const [received, setReceived] = useState(false)
  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: emailSchema },
    onSubmit: async ({ value }) => {
      setServerError(undefined)
      setReceived(false)
      try {
        const result =
          kind === "verification"
            ? await authClient.sendVerificationEmail({
                ...value,
                callbackURL: `${window.location.origin}/adresse-confirmee`,
              })
            : await authClient.requestPasswordReset({
                ...value,
                redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
              })
        if (result.error) {
          setServerError(authErrorMessage(result.error))
          return
        }
        setReceived(true)
      } catch {
        setServerError(network_error())
      }
    },
  })
  return { form, serverError, received }
}
