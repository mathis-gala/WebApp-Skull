export type AuthSession = Readonly<{
  user: Readonly<{
    id: string
    name: string
    email: string
    emailVerified: boolean
  }>
  session: Readonly<{
    id: string
  }>
}>

export type GetSession = (headers: Headers) => Promise<AuthSession | null>
