/**
 * Preprocesses a raw URL input string by trimming whitespace,
 * converting client newsreader protocols (feed://, rss://, web+feed://) to https://,
 * and prepending https:// if it has a domain structure but lacks a protocol.
 */
export function preprocessUrlInput(val: string): string {
  let cleaned = val.trim();

  // Convert feed/rss newsreader protocols to standard https
  cleaned = cleaned.replace(/^(web\+)?(feed|rss):\/\//i, "https://");

  // Prepend https:// if protocol is missing and it has a domain structure
  if (!/^https?:\/\//i.test(cleaned)) {
    const hasDomain = cleaned.includes(".") || cleaned.startsWith("localhost");
    if (hasDomain) {
      cleaned = `https://${cleaned}`;
    }
  }

  return cleaned;
}
