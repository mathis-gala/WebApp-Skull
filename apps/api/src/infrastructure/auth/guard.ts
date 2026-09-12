import {
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { CanActivate, ExecutionContext } from "@nestjs/common"
import type { Request } from "express"

import type { GetSession } from "./session.js"

export const AUTH_SESSION_READER = Symbol("AUTH_SESSION_READER")
const IS_PUBLIC = Symbol("IS_PUBLIC")

export const Public = () => SetMetadata(IS_PUBLIC, true)

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_SESSION_READER) private readonly getSession: GetSession
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<Request>()
    const headers = new Headers()

    for (const [name, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(name, item)
      } else if (value !== undefined) {
        headers.set(name, value)
      }
    }

    const session = await this.getSession(headers)

    if (!session) throw new UnauthorizedException("Authentication required")
    return true
  }
}
