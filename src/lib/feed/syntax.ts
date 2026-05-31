import hljs from "highlight.js";
import { parseHTML } from "linkedom";
import { decodeEntities } from "./normalizer";

/**
 * Scans an HTML string for <pre><code> blocks and applies syntax highlighting
 * using highlight.js with automatic language detection.
 */
export function highlightCodeBlocks(html: string): string {
  if (!html || !html.includes("<pre")) {
    return html;
  }

  const { document } = parseHTML(
    `<!DOCTYPE html><html><body>${html}</body></html>`,
  );

  const codeBlocks = document.querySelectorAll("pre code");

  if (codeBlocks.length === 0) {
    return html;
  }

  for (const code of Array.from(codeBlocks)) {
    // 1. Extract pure text content, stripping any existing spans/styling
    // and decoding HTML entities (e.g. &lt; -> <)
    const rawCode = decodeEntities(code.textContent || "");

    if (!rawCode.trim()) continue;

    try {
      // 2. Apply automatic highlighting, limited to a subset of common languages for accuracy
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

      // 3. Replace content with highlighted HTML
      code.innerHTML = result.value;

      // 4. Add hljs class to parent <pre> for styling consistency
      const pre = code.parentElement;
      if (pre) {
        pre.classList.add("hljs");
        // Also capture the detected language for metadata if needed
        if (result.language) {
          pre.setAttribute("data-language", result.language);
        }
      }
    } catch (error) {
      console.error("Failed to highlight code block:", error);
      // Fallback to original content
    }
  }

  return document.body.innerHTML;
}
