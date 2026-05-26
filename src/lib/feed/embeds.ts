import { JSDOM } from "jsdom";

/**
 * Regular expression to match YouTube URLs.
 * Matches:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
const YOUTUBE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[&?]\S*)?/gi;

/**
 * Regular expression to match Vimeo URLs.
 * Matches:
 * - vimeo.com/VIDEO_ID
 * - player.vimeo.com/video/VIDEO_ID
 */
const VIMEO_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)(?:\S*)?/gi;

/**
 * Transforms naked YouTube and Vimeo URLs within an HTML string into
 * iframe embeds with fallback links.
 *
 * It safely ignores URLs inside <a>, <code>, <pre>, <script>, <style>, and <iframe> tags.
 */
export function transformEmbeds(html: string): string {
  if (!html) return html;

  const hasYoutube = html.includes("youtube.com") || html.includes("youtu.be");
  const hasVimeo = html.includes("vimeo.com");

  if (!hasYoutube && !hasVimeo) {
    return html;
  }

  const dom = new JSDOM(`<body>${html}</body>`);
  const document = dom.window.document;

  const walker = document.createTreeWalker(
    document.body,
    dom.window.NodeFilter.SHOW_TEXT,
  );

  const nodesToReplace: { node: Node; text: string }[] = [];
  let node: Node | null = walker.nextNode();

  while (node) {
    const parent = node.parentElement;
    if (parent) {
      const _tagName = parent.tagName.toUpperCase();
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
        // Check for matches without consuming the regex state yet
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

    // Process YouTube
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

    // Process Vimeo
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
