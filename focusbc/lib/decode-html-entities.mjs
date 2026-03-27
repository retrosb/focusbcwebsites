/**
 * Decode common HTML entities in plain text from CMS/Wix exports before re-escaping for HTML.
 * Handles literal "&amp;" in JSON, numeric refs, and a few passes for double-encoded "&amp;amp;".
 */

export function decodeHtmlEntities(s) {
  if (s == null || s === "") return "";
  let str = String(s);
  for (let i = 0; i < 6; i++) {
    const prev = str;
    str = str
      .replace(/&#(\d+);/g, (_, n) => {
        const code = Number(n);
        if (!Number.isFinite(code) || code < 0) return _;
        try {
          return String.fromCodePoint(code);
        } catch {
          return _;
        }
      })
      .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => {
        const code = parseInt(h, 16);
        if (!Number.isFinite(code) || code < 0) return _;
        try {
          return String.fromCodePoint(code);
        } catch {
          return _;
        }
      })
      .replace(/&nbsp;/g, "\u00a0")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
    if (str === prev) break;
  }
  return str;
}
