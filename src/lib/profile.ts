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

type ProfileUpdate = {
  username: string;
  displayName: string;
  bio: string;
};

export function getProfileUpdateError({
  username,
  displayName,
  bio,
}: ProfileUpdate): string | null {
  const usernameError = getUsernameError(username);

  if (usernameError) {
    return usernameError;
  }

  if (displayName.length > 80) {
    return "Display name must be 80 characters or fewer.";
  }

  if (bio.length > 280) {
    return "Bio must be 280 characters or fewer.";
  }

  return null;
}
