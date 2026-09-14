"use strict";

const { collapseWhitespace } = require("../text");

const BLOCK_TAGS = "address|article|aside|blockquote|br|div|dd|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul";
const DROPPED_TAGS = "script|style|noscript|svg|template|iframe|canvas";

const NAMED_ENTITIES = Object.freeze({
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", ccedil: "ç",
  ocirc: "ô", ouml: "ö", ugrave: "ù", ucirc: "û", icirc: "î", iuml: "ï", euro: "€",
  hellip: "…", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  deg: "°", middot: "·", bull: "•", times: "×", frac12: "½", sup2: "²", copy: "©", reg: "®",
});

function decodeEntities(text) {
  return String(text ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z][a-z0-9]{1,10});/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function dropInvisible(html) {
  return String(html ?? "")
    .replace(new RegExp(`<(${DROPPED_TAGS})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, "gi"), " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

/** Visible text, block tags turned into line breaks so planning rows stay on their own line. */
function htmlToText(html) {
  const withBreaks = dropInvisible(html)
    .replace(new RegExp(`<\\/?(${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n")
    .replace(/<[^>]+>/g, " ");
  return collapseWhitespace(decodeEntities(withBreaks));
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([a-z0-9_:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
    result[match[1].toLowerCase()] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
  }
  return result;
}

function extractMeta(html) {
  const source = dropInvisible(html);
  const meta = { title: null, description: null, language: null, canonical: null };
  meta.title = decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(source)?.[1] || "").trim() || null;
  meta.language = /<html[^>]*\blang\s*=\s*["']?([a-z-]+)/i.exec(source)?.[1] || null;
  for (const match of source.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const name = (attrs.name || attrs.property || "").toLowerCase();
    if (name === "description" && attrs.content) meta.description = attrs.content.trim();
    if (name === "og:description" && attrs.content && !meta.description) meta.description = attrs.content.trim();
    if (name === "og:title" && attrs.content && !meta.title) meta.title = attrs.content.trim();
  }
  for (const match of source.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if ((attrs.rel || "").toLowerCase() === "canonical" && attrs.href) meta.canonical = attrs.href;
  }
  return meta;
}

function extractJsonLd(html) {
  const blocks = [];
  for (const match of String(html ?? "").matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeEntities(match[1].trim()));
      blocks.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // A malformed block is skipped: a half-parsed fact is worse than no fact.
    }
  }
  const flattened = [];
  for (const block of blocks) {
    flattened.push(block);
    if (Array.isArray(block?.["@graph"])) flattened.push(...block["@graph"]);
  }
  return flattened.filter((entry) => entry && typeof entry === "object");
}

function extractLinks(html, baseUrl) {
  const links = [];
  for (const match of dropInvisible(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const { href } = attributes(`<a ${match[1]}>`);
    if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) continue;
    let absolute = null;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    links.push({ url: absolute.split("#")[0], text: collapseWhitespace(decodeEntities(match[2].replace(/<[^>]+>/g, " "))) });
  }
  return links;
}

function cellsOf(rowHtml) {
  return [...rowHtml.matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map((match) => ({
    header: match[1].toLowerCase() === "th",
    colspan: Number(attributes(`<td ${match[2]}>`).colspan || 1) || 1,
    text: collapseWhitespace(decodeEntities(match[3].replace(new RegExp(`<(${DROPPED_TAGS})[\\s\\S]*?<\\/\\1>`, "gi"), " ").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))),
  }));
}

function extractTables(html) {
  const tables = [];
  for (const match of dropInvisible(html).matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows = [...match[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => cellsOf(row[1]));
    if (!rows.length) continue;
    const headerRow = rows.find((row) => row.every((cell) => cell.header) && row.length > 1) || null;
    tables.push({
      headers: headerRow ? headerRow.map((cell) => cell.text) : [],
      rows: rows.filter((row) => row !== headerRow).map((row) => row.map((cell) => cell.text)),
      cells: rows,
    });
  }
  return tables;
}

/** Headings paired with the text that follows them — how most planning pages are laid out. */
function extractSections(html) {
  const source = dropInvisible(html);
  const sections = [];
  const pattern = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match = pattern.exec(source);
  while (match) {
    const start = match.index + match[0].length;
    const next = pattern.exec(source);
    sections.push({
      level: Number(match[1].slice(1)),
      heading: collapseWhitespace(decodeEntities(match[2].replace(/<[^>]+>/g, " "))),
      text: htmlToText(source.slice(start, next ? next.index : source.length)),
    });
    match = next;
  }
  return sections;
}

function extractListItems(html) {
  return [...dropInvisible(html).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => collapseWhitespace(decodeEntities(match[1].replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))))
    .filter(Boolean);
}

module.exports = {
  attributes,
  decodeEntities,
  dropInvisible,
  extractJsonLd,
  extractLinks,
  extractListItems,
  extractMeta,
  extractSections,
  extractTables,
  htmlToText,
};
