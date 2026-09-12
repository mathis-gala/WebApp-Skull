import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesUnder(path)))
    else files.push(path)
  }
  return files
}

const failures = []
const rootManifest = JSON.parse(await readFile(resolve(root, "package.json")))
if (rootManifest.packageManager !== "pnpm@12.4.1") {
  failures.push("packageManager must remain pnpm@12.4.1")
}

const webFiles = await filesUnder(resolve(root, "apps/web/src"))
for (const file of webFiles.filter((file) =>
  [".ts", ".tsx"].includes(extname(file))
)) {
  const content = await readFile(file, "utf8")
  if (
    /from ["'](?:@workspace\/(?:database|email|core)|.*apps\/api)/.test(content)
  ) {
    failures.push(`server import in web: ${relative(root, file)}`)
  }
}

for (const composeFile of ["compose.yml", "compose.test.yml"]) {
  const content = await readFile(resolve(root, composeFile), "utf8")
  for (const match of content.matchAll(/^\s*image:\s*(\S+)/gm)) {
    if (!match[1]?.includes(":") || match[1].endsWith(":latest")) {
      failures.push(`unpinned image in ${composeFile}: ${match[1]}`)
    }
  }
}

const packageEntries = await readdir(resolve(root, "packages"), {
  withFileTypes: true,
})
const sourceDirectories = [
  resolve(root, "apps/api/src"),
  resolve(root, "apps/web/src"),
  ...packageEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(root, "packages", entry.name, "src")),
]
const activeFiles = []
for (const directory of sourceDirectories) {
  try {
    activeFiles.push(...(await filesUnder(directory)))
  } catch {
    // A package may contain only configuration files.
  }
}
for (const file of activeFiles) {
  const content = await readFile(file, "utf8")
  if (/\b(?:Elysia|Eden|Bun)\b|["']elysia["']|@elysiajs/.test(content)) {
    failures.push(`retired technology reference: ${relative(root, file)}`)
  }
}

const routes = [
  "adresse-confirmee.tsx",
  "connexion.tsx",
  "index.tsx",
  "inscription.tsx",
  "mot-de-passe-oublie.tsx",
  "nouveau-mot-de-passe.tsx",
  "verification-email.tsx",
]
for (const route of routes) {
  const content = await readFile(
    resolve(root, "apps/web/src/routes", route),
    "utf8"
  )
  if (!content.includes("privateHead(")) {
    failures.push(`missing private metadata contract: ${route}`)
  }
}

const workflow = await readFile(
  resolve(root, ".github/workflows/ci.yml"),
  "utf8"
)
for (const match of workflow.matchAll(/uses:\s*([^\s]+)@([^\s#]+)/g)) {
  if (!/^[a-f0-9]{40}$/.test(match[2])) {
    failures.push(`GitHub action is not pinned to a commit: ${match[1]}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"))
  process.exitCode = 1
} else {
  console.log("Project boundaries, metadata and infrastructure pins checked")
}
