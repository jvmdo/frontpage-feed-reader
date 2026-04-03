import { decodeHTML } from "entities";

/**
 * Decodes HTML entities in a string.
 */
export function decodeEntities(text: string | undefined | null): string {
  if (!text) return "";
  return decodeHTML(text);
}
