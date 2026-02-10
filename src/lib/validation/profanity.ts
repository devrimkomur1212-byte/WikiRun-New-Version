// Common slurs and offensive terms to block from usernames.
// This list checks for substrings within the username (case-insensitive).
const BANNED_WORDS = [
  // Racial slurs
  "nigger", "nigga", "nigg", "n1gger", "n1gga", "n1gg",
  "chink", "ch1nk", "gook", "spic", "sp1c", "wetback",
  "kike", "k1ke", "beaner", "coon", "c00n", "darkie",
  "jigaboo", "raghead", "towelhead", "camelj", "zipperhead",
  "redskin", "squaw", "pajeet",
  // Homophobic slurs
  "faggot", "fagg0t", "f4ggot", "fag", "f4g", "dyke",
  "tranny", "tr4nny",
  // Sexist / gendered slurs
  "whore", "wh0re", "slut", "slutt", "cunt",
  // General offensive
  "retard", "ret4rd", "r3tard",
  // Nazi / hate symbols
  "nazi", "n4zi", "heil", "h3il", "hitler", "h1tler",
  "holocaust", "genocide",
  // Sexual
  "penis", "p3nis", "vagina", "v4gina",
  "porn", "p0rn", "hentai",
  // Misc slurs
  "cracker", "honkey", "honky", "gringo",
];

/**
 * Check if a username contains any banned/offensive words.
 * Returns the matched banned word if found, or null if clean.
 */
export function containsProfanity(username: string): string | null {
  const lower = username.toLowerCase();
  // Also check with common leet-speak normalization
  const normalized = lower
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/@/g, "a");

  for (const word of BANNED_WORDS) {
    if (lower.includes(word) || normalized.includes(word)) {
      return word;
    }
  }
  return null;
}

/**
 * Validate a username: length, characters, and profanity check.
 * Returns an error message string, or null if valid.
 */
export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 20) {
    return "Username must be between 3 and 20 characters";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  if (containsProfanity(username)) {
    return "Username contains inappropriate language";
  }
  return null;
}
