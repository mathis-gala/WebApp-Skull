import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Toaster } from "@workspace/ui/components/sonner"
import { CircleUserRoundIcon, LogOutIcon } from "lucide-react"
import { ThemeProvider } from "next-themes"

import { authClient } from "@/lib/auth/auth-client"
import type { RouterContext } from "@/router"

import appCss from "@workspace/ui/globals.css?url"

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "WebApp Skull",
      },
      {
        name: "description",
        content: "Secure web application.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="main-content">
        <Outlet />
      </main>
    </>
  )
}

function AppHeader() {
  const session = authClient.useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    await router.navigate({ to: "/" })
    await router.invalidate()
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <nav
          className="flex items-center gap-1"
          aria-label="Primary navigation"
        >
          <Button variant="ghost" asChild>
            <Link to="/">WebApp Skull</Link>
          </Button>
        </nav>
        {session.data ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.data.user.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/sign-in">
              <CircleUserRoundIcon data-icon="inline-start" />
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}

function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center gap-4 px-4">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        The requested route does not exist.
      </p>
      <Separator />
      <Button className="self-start" asChild>
        <Link to="/">Return home</Link>
      </Button>
    </section>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
