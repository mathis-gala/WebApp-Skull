import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: new URL("../../.env", import.meta.url).pathname })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/auth.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
})
