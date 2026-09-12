export function getSafeRedirect(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/"
  const ambiguous =
    value.includes("\\") ||
    value.includes("%") ||
    [...value].some((character) => character.charCodeAt(0) <= 32)
  if (ambiguous) return "/"
  const parsed = new URL(value, "https://internal.invalid")
  if (parsed.origin !== "https://internal.invalid") return "/"
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}
