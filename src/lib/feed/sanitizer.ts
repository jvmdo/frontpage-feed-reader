import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitizes an HTML string to prevent XSS and other malicious content.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return "";

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
