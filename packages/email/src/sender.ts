import { createConnection } from "node:net"
import type { Socket } from "node:net"
import nodemailer from "nodemailer"
import type { EmailMessage, EmailSender } from "@workspace/core/email"
import type { EmailConfig } from "./config.js"

export function createSmtpSender(config: EmailConfig): EmailSender {
  return {
    async send(message) {
      if (
        config.APP_ENV === "staging" &&
        config.EMAIL_MODE === "smtp" &&
        !config.EMAIL_ALLOWED_RECIPIENTS.includes(message.to.toLowerCase())
      )
        throw new Error("EMAIL_RECIPIENT_NOT_ALLOWED")
      let socket: Socket | undefined
      const transport = nodemailer.createTransport({
        getSocket: (_options, callback) => {
          const connection = createConnection({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
          })
          socket = connection
          let handedOff = false
          connection.once("error", (error) => {
            if (!handedOff) callback(error)
          })
          connection.once("connect", () => {
            handedOff = true
            callback(null, { connection, secured: false })
          })
        },
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        requireTLS: config.EMAIL_MODE === "smtp",
        auth: config.SMTP_USER
          ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
          : undefined,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        dnsTimeout: 10000,
        disableFileAccess: true,
        disableUrlAccess: true,
        logger: false,
        debug: false,
      })
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          transport.sendMail({
            from: config.EMAIL_FROM,
            to: { name: "", address: message.to },
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              socket?.destroy(new Error("EMAIL_TIMEOUT"))
              transport.close()
              reject(new Error("EMAIL_TIMEOUT"))
            }, 10000)
          }),
        ])
      } catch {
        throw new Error("EMAIL_DELIVERY_FAILED")
      } finally {
        clearTimeout(timeout)
        socket?.destroy()
        transport.close()
      }
    },
  }
}

export class MemoryEmailSender implements EmailSender {
  readonly messages: EmailMessage[] = []
  async send(message: EmailMessage) {
    this.messages.push(message)
  }
}
