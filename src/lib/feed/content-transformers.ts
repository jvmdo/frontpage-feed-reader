import hljs from "highlight.js";
import { NodeFilter, parseHTML } from "linkedom";
import { decodeEntities } from "./normalizer";

/**
 * Regular expression to match YouTube URLs.
 */
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[&?]\S*)?/gi;

/**
 * Regular expression to match Vimeo URLs.
 */
const VIMEO_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)(?:\S*)?/gi;

/**
 * Transforms naked YouTube and Vimeo URLs within an HTML string or LinkeDOM document.
 * Safely ignores URLs inside <a>, <code>, <pre>, <script>, <style>, and <iframe> tags.
 */
export function transformEmbeds(target: Document | string): string {
  if (!target) return target as any;
  if (typeof target === "string") {
    const hasYoutube =
      target.includes("youtube.com") || target.includes("youtu.be");
    const hasVimeo = target.includes("vimeo.com");
    if (!hasYoutube && !hasVimeo) return target;

    const { document } = parseHTML(
      `<!DOCTYPE html><html><body>${target}</body></html>`,
    );
    transformEmbeds(document);
    return document.body.innerHTML;
  }

  const document = target;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  const nodesToReplace: { node: Node; text: string }[] = [];
  let node: Node | null = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (parent) {
      const forbiddenTags = [
        "A",
        "CODE",
        "PRE",
        "SCRIPT",
        "STYLE",
        "IFRAME",
        "TEXTAREA",
      ];

      let isInsideForbidden = false;
      let current: HTMLElement | null = parent;
      while (current && current !== document.body) {
        if (forbiddenTags.includes(current.tagName.toUpperCase())) {
          isInsideForbidden = true;
          break;
        }
        current = current.parentElement;
      }

      if (!isInsideForbidden && node.nodeValue) {
        const text = node.nodeValue;
        YOUTUBE_REGEX.lastIndex = 0;
        VIMEO_REGEX.lastIndex = 0;
        if (YOUTUBE_REGEX.test(text) || VIMEO_REGEX.test(text)) {
          nodesToReplace.push({ node, text });
        }
      }
    }
    node = walker.nextNode();
  }

  for (const { node, text } of nodesToReplace) {
    let newHtml = text;

    YOUTUBE_REGEX.lastIndex = 0;
    newHtml = newHtml.replace(YOUTUBE_REGEX, (match, id) => {
      return `
        <div class="video-embed">
          <iframe 
            src="https://www.youtube.com/embed/${id}" 
            allowfullscreen 
            width="560" 
            height="315" 
            frameborder="0"
          ></iframe>
          <p><a href="${match}">Watch on YouTube</a></p>
        </div>
      `;
    });

    VIMEO_REGEX.lastIndex = 0;
    newHtml = newHtml.replace(VIMEO_REGEX, (match, id) => {
      return `
        <div class="video-embed">
          <iframe 
            src="https://player.vimeo.com/video/${id}" 
            allowfullscreen 
            width="640" 
            height="360" 
            frameborder="0"
          ></iframe>
          <p><a href="${match}">Watch on Vimeo</a></p>
        </div>
      `;
    });

    if (newHtml !== text) {
      const wrapper = document.createElement("span");
      wrapper.innerHTML = newHtml;

      const parent = node.parentNode;
      if (parent) {
        while (wrapper.firstChild) {
          parent.insertBefore(wrapper.firstChild, node);
        }
        parent.removeChild(node);
      }
    }
  }

  return document.body.innerHTML;
}

/**
 * Scans an HTML string or LinkeDOM document for <pre><code> blocks and applies syntax highlighting.
 */
export function highlightCodeBlocks(target: Document | string): string {
  if (!target) return target as any;
  if (typeof target === "string") {
    if (!target?.includes("<pre")) return target;
    const { document } = parseHTML(
      `<!DOCTYPE html><html><body>${target}</body></html>`,
    );
    highlightCodeBlocks(document);
    return document.body.innerHTML;
  }

  const document = target;
  const codeBlocks = document.querySelectorAll("pre code");
  if (codeBlocks.length === 0) {
    return document.body.innerHTML;
  }

  for (const code of Array.from(codeBlocks)) {
    const rawCode = decodeEntities(code.textContent || "");
    if (!rawCode.trim()) continue;

    try {
      const result = hljs.highlightAuto(rawCode, [
        "javascript",
        "typescript",
        "html",
        "css",
        "json",
        "yaml",
        "markdown",
        "sql",
        "bash",
        "python",
        "rust",
        "go",
        "java",
        "kotlin",
        "swift",
        "c",
        "cpp",
        "csharp",
        "php",
        "ruby",
        "xml",
        "dockerfile",
      ]);

      code.innerHTML = result.value;

      const pre = code.parentElement;
      if (pre) {
        pre.classList.add("hljs");
        if (result.language) {
          pre.setAttribute("data-language", result.language);
        }
      }
    } catch (error) {
      console.error("Failed to highlight code block:", error);
    }
  }

  return document.body.innerHTML;
}

/**
 * Single-pass HTML content enhancer.
 * Parses HTML string into a LinkeDOM document ONCE and applies video embeds
 * and code syntax highlighting in a unified pass.
 */
export function enhanceHtmlContent(html: string | undefined | null): string {
  if (!html) return html ?? "";

  const hasVideo =
    html.includes("youtube.com") ||
    html.includes("youtu.be") ||
    html.includes("vimeo.com");
  const hasCode = html.includes("<pre");

  if (!hasVideo && !hasCode) {
    return html;
  }

  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${html}</body></html>`,
  );

  if (hasVideo) {
    transformEmbeds(document);
  }

  if (hasCode) {
    highlightCodeBlocks(document);
  }

  return document.body.innerHTML;
}
