import { defineConfig, mergeConfig } from "vite"
import config from "./vite.config"

export default mergeConfig(
  config,
  defineConfig({
    envDir: false,
    server: { strictPort: true, host: "127.0.0.1" },
  })
)
