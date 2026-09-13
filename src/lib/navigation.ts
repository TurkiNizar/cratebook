const INTERNAL_URL_BASE = "https://cratebook.invalid";

export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/collection",
) {
  if (!value?.startsWith("/") || /%(?:2f|5c)/i.test(value)) return fallback;

  try {
    const resolved = new URL(value, INTERNAL_URL_BASE);
    if (resolved.origin !== INTERNAL_URL_BASE) return fallback;

    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
