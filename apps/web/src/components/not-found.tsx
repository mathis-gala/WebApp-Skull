import { Link } from "@tanstack/react-router"
import {
  not_found_title,
  not_found_description,
  return_home,
} from "@workspace/i18n/messages"
import { Button } from "@workspace/ui/components/button"
import { httpStatus } from "@/lib/api/http-status"

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center gap-4 px-5">
      <p className="text-sm text-muted-foreground">{httpStatus.notFound}</p>
      <h1 className="text-3xl font-semibold">{not_found_title()}</h1>
      <p>{not_found_description()}</p>
      <Button asChild className="self-start">
        <Link to="/">{return_home()}</Link>
      </Button>
    </section>
  )
}
