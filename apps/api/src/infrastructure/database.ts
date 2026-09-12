import { createDatabase } from "@workspace/database"

import { getEnv } from "../config/env.js"

const env = getEnv()

export const database = createDatabase(env.DATABASE_URL)
