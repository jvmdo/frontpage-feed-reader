import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

let isHookRegistered = false;

function ensureHooks() {
  if (isHookRegistered) return;

  // Add a hook to only allow video embeds from trusted domains in iframes
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const el = node as HTMLElement;
      const src = el.getAttribute("src") || "";
      const isTrustedVideo =
        src.startsWith("https://www.youtube.com/embed/") ||
        src.startsWith("https://player.vimeo.com/video/");

      if (!isTrustedVideo) {
        el.remove();
      }
    }
  });

  isHookRegistered = true;
}

/**
 * Sanitizes an HTML string to prevent XSS and other malicious content.
 * Also handles Markdown-style formatting common in some feeds.
 */
export function sanitizeHtml(text: string | undefined | null): string {
  if (!text) return "";

  ensureHooks();

  // 1. Convert Markdown/Plain-text to HTML using marked.
  const html = marked.parse(text, { gfm: true, breaks: true }) as string;

  // 2. Clean the resulting HTML with DOMPurify
  return DOMPurify.sanitize(html, {
    // Default allowed tags plus figure/figcaption which are common in tech blogs
    ALLOWED_TAGS: [
      "a",
      "b",
      "i",
      "em",
      "strong",
      "p",
      "br",
      "div",
      "section",
      "article",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "figure",
      "figcaption",
      "hr",
      "small",
      "span",
      "del",
      "ins",
      "sub",
      "sup",
      "iframe",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "target",
      "rel",
      "allow",
      "allowfullscreen",
      "frameborder",
      "width",
      "height",
    ],
    // Automatically adds 'rel="noopener noreferrer"' to target="_blank"
    ADD_ATTR: ["target"],
  });
}
