import {
  page_error_title,
  network_error,
  retry,
} from "@workspace/i18n/messages"
import { Button } from "@workspace/ui/components/button"

export function PageError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center gap-4 px-5">
      <h1 className="text-3xl font-semibold">{page_error_title()}</h1>
      <p role="alert">{network_error()}</p>
      <Button onClick={reset}>{retry()}</Button>
    </section>
  )
}
