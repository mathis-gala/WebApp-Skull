import { renderAuthEmail } from "@workspace/email"
import type { AuthEmailInput } from "@workspace/email"
import type { EmailSender } from "@workspace/core/email"

export interface EmailEvent {
  event: "email.accepted" | "email.failed" | "email.drain_timeout"
  kind?: AuthEmailInput["kind"]
}

export class AuthEmailDispatcher {
  private readonly pending = new Set<Promise<void>>()
  private stopping = false
  constructor(
    private readonly sender: EmailSender,
    private readonly report: (event: EmailEvent) => void
  ) {}

  enqueue(input: AuthEmailInput) {
    if (this.stopping) {
      this.report({ event: "email.failed", kind: input.kind })
      return
    }
    const operation = Promise.resolve()
      .then(async () => {
        const message = await renderAuthEmail(input)
        await this.sender.send(message)
        this.report({ event: "email.accepted", kind: input.kind })
      })
      .catch(() => {
        this.report({ event: "email.failed", kind: input.kind })
      })
    this.pending.add(operation)
    void operation.then(() => {
      this.pending.delete(operation)
    })
  }

  async drain(timeoutMs = 15000) {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([
        Promise.all(this.pending),
        new Promise<void>((resolve) => {
          timer = setTimeout(() => {
            this.report({ event: "email.drain_timeout" })
            resolve()
          }, timeoutMs)
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  }

  async close() {
    this.stopping = true
    await this.drain()
  }
}
