import projectConfig from "@workspace/config/project" with { type: "json" }

export function privateHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · ${projectConfig.name}` },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }
}
