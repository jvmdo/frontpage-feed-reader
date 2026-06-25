import { decodeHTML } from "entities";
import { convert } from "html-to-text";

/**
 * Extracts plain text from an HTML string, ensuring block elements are separated
 * by spaces and tags are completely removed.
 * Handles double-encoded entities common in some RSS feeds.
 */
export function extractText(html: string | undefined | null): string {
  if (!html) return "";

  try {
    let processedHtml = html;

    // Heuristic: If the input has no raw HTML tags but has encoded tags (common in double-encoded feeds),
    // decode it first to get the HTML tags for the converter to parse. Otherwise, keep it raw
    // to avoid decoding legitimate code entities (e.g. &lt;div&gt;) into actual tags.
    const hasRawTags = /<[a-z0-9/!-]+[^>]*>/i.test(processedHtml);
    const hasEncodedTags = /&(?:amp;)?lt;[a-z0-9/!-]+/i.test(processedHtml);

    if (!hasRawTags && hasEncodedTags) {
      processedHtml = decodeHTML(processedHtml);
      // Double check in case of double encoding
      if (!/<[a-z0-9/!-]+[^>]*>/i.test(processedHtml)) {
        processedHtml = decodeHTML(processedHtml);
      }
    }

    // 2. Pre-process HTML: wrap tags in spaces to ensure inline elements
    // don't result in stuck words (e.g. <b>a</b><i>b</i> -> "a b" instead of "ab")
    const spacedHtml = processedHtml.replace(/<\/?[a-z0-9-]+[^>]*>/gi, " $& ");

    // 3. Use html-to-text with search-optimized settings
    const text = convert(spacedHtml, {
      wordwrap: false, // Don't add arbitrary line breaks
      selectors: [
        { selector: "a", options: { ignoreHref: true } }, // Don't print URLs
        { selector: "img", format: "skip" }, // Don't print alt text for indexing
        { selector: "hr", format: "skip" },
        { selector: "iframe", format: "skip" },
        { selector: "video", format: "skip" },
        { selector: "h1", options: { uppercase: false } },
        { selector: "h2", options: { uppercase: false } },
        { selector: "h3", options: { uppercase: false } },
        { selector: "h4", options: { uppercase: false } },
        { selector: "h5", options: { uppercase: false } },
        { selector: "h6", options: { uppercase: false } },
      ],
    });

    // 4. Final cleanup of whitespace and normalization
    const decodedText = decodeHTML(text);
    return decodedText
      .replace(/[\u200B\u200C\uFEFF]/g, "") // Remove zero-width formatting characters (ZWSP, ZWNJ, BOM)
      .replace(/\s+/g, " ") // Collapse multiple spaces/newlines into one space
      .replace(/(?:\s*,\s*){2,}/g, ", ") // Collapse multiple commas (failed templates)
      .trim();
  } catch (error) {
    console.error("Failed to extract text from HTML:", error);
    // Fallback to simple regex if library fails
    return decodeHTML(html)
      .replace(/[\u200B\u200C\uFEFF]/g, "")
      .replace(/<[^>]*>?/gm, "")
      .trim();
  }
}
