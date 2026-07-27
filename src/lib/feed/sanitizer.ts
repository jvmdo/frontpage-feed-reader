import sanitize from "sanitize-html";
import { resolveRelativeUrl } from "./normalizer";

/**
 * Sanitizes an HTML string to prevent XSS and other malicious content.
 * Uses sanitize-html for a lightweight, JSDOM-free implementation suitable for background tasks.
 */
export function sanitizeHtml(
  text: string | undefined | null,
  baseUrl?: string,
): string {
  if (!text) return "";

  const sanitized = sanitize(text, {
    // 1. Tags allowed for tech blogs and layouts
    allowedTags: [
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
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "cite",
      "hr",
      "small",
      "span",
      "del",
      "ins",
      "sub",
      "sup",
      "iframe",
    ],

    // 2. Attributes allowed per tag
    allowedAttributes: {
      "*": ["class", "title"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      iframe: [
        "src",
        "allow",
        "allowfullscreen",
        "frameborder",
        "width",
        "height",
      ],
    },

    // 3. Trusted video domains for iframes
    allowedIframeHostnames: ["www.youtube.com", "player.vimeo.com"],

    // 4. Transform tags for security and URL resolution
    transformTags: {
      a: (tagName, attribs) => {
        // Security best practices for links
        attribs.target = "_blank";
        attribs.rel = "noopener noreferrer";

        // Resolve relative URLs
        if (baseUrl && attribs.href) {
          const href = attribs.href;
          if (
            !href.startsWith("http") &&
            !href.startsWith("//") &&
            !href.startsWith("mailto:") &&
            !href.startsWith("tel:") &&
            !href.startsWith("#")
          ) {
            const resolved = resolveRelativeUrl(href, baseUrl);
            if (resolved) {
              attribs.href = resolved;
            }
          }
        }
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        // Resolve relative URLs for images
        if (baseUrl && attribs.src) {
          const src = attribs.src;
          if (
            !src.startsWith("http") &&
            !src.startsWith("//") &&
            !src.startsWith("data:")
          ) {
            const resolved = resolveRelativeUrl(src, baseUrl);
            if (resolved) {
              attribs.src = resolved;
            }
          }
        }
        return { tagName, attribs };
      },
    },

    // 5. Custom filters for security edge cases
    exclusiveFilter: (frame) => {
      // Precise prefix check for YouTube and Vimeo embeds
      if (frame.tag === "iframe") {
        const src = frame.attribs.src || "";
        const isTrusted =
          src.startsWith("https://www.youtube.com/embed/") ||
          src.startsWith("https://player.vimeo.com/video/");
        return !isTrusted;
      }
      return false;
    },
  });

  return (
    sanitized
      // 1. Remove visually empty tags
      // This regex identifies tags that contain only whitespace or &nbsp;
      .replace(
        /<(p|div|h[1-6]|section|article|blockquote|ul|ol|li)[^>]*>(?:\s|&nbsp;|\u00a0)*<\/\1>/gi,
        "",
      )
      .trim()
  );
}
