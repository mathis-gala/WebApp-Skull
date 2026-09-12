import { Controller, Get } from "@nestjs/common"

import { Public } from "../../infrastructure/auth/guard.js"

type HealthResponse = Readonly<{ status: "ok" }>

@Controller("health")
export class HealthController {
  @Public()
  @Get("live")
  live(): HealthResponse {
    return { status: "ok" }
  }

  @Public()
  @Get("ready")
  ready(): HealthResponse {
    return { status: "ok" }
  }
}
