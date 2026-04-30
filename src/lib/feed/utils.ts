/**
 * Heuristic to detect if a feed item is an excerpt rather than the full article.
 */
export function isExcerpt(item: {
  content?: string | null;
  description?: string | null;
}): boolean {
  // 1. If content is missing entirely, it's definitely an excerpt (we only have description)
  if (!item.content) return true;

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, "").trim();
  const cleanContent = stripHtml(item.content);
  const cleanDescription = item.description ? stripHtml(item.description) : "";

  // 2. If content is identical to description, it's likely an excerpt
  if (cleanContent === cleanDescription) return true;

  // 3. If content is very short (under 500 chars), it's likely an excerpt
  if (cleanContent.length < 500) return true;

  // 4. If description exists and content is only slightly longer, it's likely an excerpt
  // Full articles usually have summaries much smaller than the full content.
  if (
    cleanDescription.length > 0 &&
    cleanContent.length < cleanDescription.length * 1.5
  ) {
    return true;
  }

  // 5. Common patterns indicating the feed is truncated
  const readMorePatterns = [
    /read more/i,
    /continue reading/i,
    /full post/i,
    /appeared first on/i,
  ];

  return readMorePatterns.some((pattern) => pattern.test(cleanContent));
}
