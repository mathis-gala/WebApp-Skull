import { useForm } from "@tanstack/react-form"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { network_error, reset_complete } from "@workspace/i18n/messages"
import { authClient } from "@/lib/auth/auth-client"
import { clearPrivateCache } from "@/lib/auth/current-user"
import { resetPasswordSchema } from "../schemas/auth-form"
import { authErrorMessage } from "../auth-error"

export function useResetPasswordForm(token: string) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string>()
  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      setServerError(undefined)
      try {
        const result = await authClient.resetPassword({
          token,
          newPassword: value.password,
        })
        if (result.error) {
          setServerError(authErrorMessage(result.error))
          return
        }
        await clearPrivateCache(router.options.context.queryClient)
        await router.navigate({ to: "/connexion", replace: true })
        toast.success(reset_complete())
      } catch {
        setServerError(network_error())
      }
    },
  })
  return { form, serverError }
}
