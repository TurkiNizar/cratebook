const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

export const RESERVED_USERNAMES = new Set([
  "add",
  "admin",
  "api",
  "auth",
  "collection",
  "help",
  "privacy",
  "settings",
  "sign-in",
  "support",
  "terms",
  "wishlist",
]);

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function getUsernameError(value: string): string | null {
  const username = normalizeUsername(value);

  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3–30 letters, numbers, underscores, or hyphens. Start and end with a letter or number.";
  }

  if (RESERVED_USERNAMES.has(username)) {
    return "That username is reserved. Please choose another.";
  }

  return null;
}
