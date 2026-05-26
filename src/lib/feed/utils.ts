/**
 * Heuristic to detect if a feed item is an excerpt rather than the full article.
 */
export function isExcerpt(item: {
  content?: string | null;
  description?: string | null;
}): boolean {
  if (!item.content) return true;

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, "").trim();
  const cleanContent = stripHtml(item.content);
  const cleanDescription = item.description ? stripHtml(item.description) : "";

  // 1. Same content? Definitely an excerpt (summary-only feed).
  if (cleanContent === cleanDescription && cleanContent.length > 0) return true;

  // 2. Size guards (Extreme cases)
  // If it's substantial, it's almost certainly not an excerpt, regardless of footer text.
  if (cleanContent.length > 3000) return false;
  // If content is very short (under 200), it's likely a teaser.
  if (cleanContent.length < 200) return true;

  // 3. Truncation patterns at the END of content are strong signals.
  // We use word boundaries and check only the tail to avoid technical term clashes.
  const truncationPatterns = [
    /\bread more\b/i,
    /\bcontinue reading\b/i,
    /\bfull post\b/i,
    /\bread full article\b/i,
    /\bclick here to read\b/i,
    /\bview the full article\b/i,
  ];

  const tail = cleanContent.slice(-150);
  if (truncationPatterns.some((p) => p.test(tail))) return true;

  // 4. Ratio Check
  // Full articles usually have summaries much smaller than the full content.
  // If content is significantly larger than description, it's likely full.
  if (
    cleanDescription.length > 0 &&
    cleanContent.length > cleanDescription.length * 2.5
  ) {
    return false;
  }

  // 5. Suspicious closeness
  // If content is only slightly longer than description, it's likely a teaser.
  if (
    cleanDescription.length > 0 &&
    cleanContent.length < cleanDescription.length * 1.2
  ) {
    return true;
  }

  return false;
}
