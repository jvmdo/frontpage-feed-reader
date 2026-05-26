import DOMPurify from "isomorphic-dompurify";

let isHookRegistered = false;
let currentBaseUrl: string | undefined = undefined;

function ensureHooks() {
  if (isHookRegistered) return;

  // Add a hook for element-level transformations
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    const el = node as HTMLElement;
    const tagName = data.tagName?.toUpperCase();

    // 1. Only allow video embeds from trusted domains in iframes
    if (tagName === "IFRAME") {
      const src = el.getAttribute("src") || "";
      const isTrustedVideo =
        src.startsWith("https://www.youtube.com/embed/") ||
        src.startsWith("https://player.vimeo.com/video/");

      if (!isTrustedVideo) {
        el.remove();
      }
    }

    // 2. Remove visually empty tags (containing only whitespace or &nbsp;)
    // We exclude tags that are meant to be empty like img, iframe, hr, br.
    const emptyTrappableTags = [
      "P",
      "DIV",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "SECTION",
      "ARTICLE",
      "BLOCKQUOTE",
      "UL",
      "OL",
      "LI",
    ];

    if (tagName && emptyTrappableTags.includes(tagName)) {
      const content = el.textContent?.replace(/\u00a0/g, " ").trim();
      if (!content && (!el.children || el.children.length === 0)) {
        el.remove();
      }
    }
  });

  // Add a hook to ensure all links open in a new tab and resolve relative URLs
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    const el = node as HTMLElement;

    // 1. Security best practices for links
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }

    // 2. Resolve relative URLs if a base URL is provided
    if (currentBaseUrl) {
      if (el.tagName === "A" && el.hasAttribute("href")) {
        const href = el.getAttribute("href");
        if (
          href &&
          !href.startsWith("http") &&
          !href.startsWith("//") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:") &&
          !href.startsWith("#")
        ) {
          try {
            el.setAttribute("href", new URL(href, currentBaseUrl).toString());
          } catch {
            // Ignore invalid URLs
          }
        }
      }

      if (el.tagName === "IMG" && el.hasAttribute("src")) {
        const src = el.getAttribute("src");
        if (
          src &&
          !src.startsWith("http") &&
          !src.startsWith("//") &&
          !src.startsWith("data:")
        ) {
          try {
            el.setAttribute("src", new URL(src, currentBaseUrl).toString());
          } catch {
            // Ignore invalid URLs
          }
        }
      }
    }
  });

  isHookRegistered = true;
}

/**
 * Sanitizes an HTML string to prevent XSS and other malicious content.
 */
export function sanitizeHtml(
  text: string | undefined | null,
  baseUrl?: string,
): string {
  if (!text) return "";

  currentBaseUrl = baseUrl;
  ensureHooks();

  // Clean the HTML with DOMPurify
  const sanitized = DOMPurify.sanitize(text, {
    // Default allowed tags plus layout and semantic tags common in tech blogs
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
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "div",
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
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "target",
      "rel",
      "class",
      "allow",
      "allowfullscreen",
      "frameborder",
      "width",
      "height",
    ],
    // Automatically adds 'rel="noopener noreferrer"' to target="_blank"
    ADD_ATTR: ["target"],
  }) as string;

  currentBaseUrl = undefined;
  return sanitized;
}
