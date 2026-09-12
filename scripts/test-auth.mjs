import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const project = `skull-auth-test-${randomUUID().slice(0, 8)}`
const compose = [
  "compose",
  "--env-file",
  "/dev/null",
  "-p",
  project,
  "-f",
  "compose.test.yml",
]
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status})`)
  return result.stdout?.trim()
}
function port(service, target) {
  return run("docker", [...compose, "port", service, String(target)], {
    stdio: "pipe",
  })
    .split(":")
    .at(-1)
}
try {
  run("docker", [...compose, "up", "--wait", "--wait-timeout", "90", "-d"])
  const env = {
    ...process.env,
    APP_ENV: "test",
    AUTH_TEST_OWNED: project,
    AUTH_TEST_DATABASE_URL: `postgresql://skull_auth_test:isolated-fixture-only@127.0.0.1:${port("postgres", 5432)}/skull_auth_test`,
    AUTH_TEST_SMTP_PORT: port("mailpit", 1025),
    AUTH_TEST_MAILPIT_URL: `http://127.0.0.1:${port("mailpit", 8025)}`,
  }
  run("pnpm", ["--filter", "@workspace/api^...", "build"], { env })
  run(
    "pnpm",
    [
      "--filter",
      "@workspace/api",
      "exec",
      "vitest",
      "run",
      "--config",
      "vitest.integration.config.ts",
    ],
    { env }
  )
} finally {
  // Only the uniquely named resources created above are removed. No dev volumes exist here.
  run("docker", [...compose, "down", "--remove-orphans"])
}
