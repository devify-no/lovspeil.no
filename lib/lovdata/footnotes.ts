/**
 * Add scoped ids and jump links for Lovdata footnotes in section HTML.
 */
export function enhanceFootnotes(html: string, scopeId: string): string {
  if (!html.includes("footnotereference") && !html.includes("footnotes")) {
    return html;
  }

  const safeScope = scopeId.replace(/[^a-zA-Z0-9_-]/g, "-");

  let result = html.replace(
    /<article class="footnote"([^>]*)>/gi,
    (match, attrs: string) => {
      if (/\bid="/i.test(attrs)) return match;
      const counter =
        attrs.match(/data-unique-footnote-counter="(\d+)"/i)?.[1] ??
        attrs.match(/data-name="(\d+)"/i)?.[1];
      if (!counter) return match;
      return `<article class="footnote"${attrs} id="fn-${safeScope}-${counter}">`;
    }
  );

  result = result.replace(
    /<sup class="footnotereference"([^>]*)>(\d+)<\/sup>/gi,
    (match, attrs: string, num: string) => {
      const counter =
        attrs.match(/data-unique-footnote-counter="(\d+)"/i)?.[1] ?? num;
      const target = `fn-${safeScope}-${counter}`;
      if (match.includes('class="footnote-ref"')) return match;
      return `<sup class="footnotereference"${attrs}><a href="#${target}" class="footnote-ref">${num}</a></sup>`;
    }
  );

  return result;
}
