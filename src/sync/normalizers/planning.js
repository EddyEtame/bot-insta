"use strict";

const { DAYS, parseTime, parseTimeRange } = require("../../calendar");
const { collapseWhitespace, flatten, normalize } = require("../../text");
const { extractJsonLd, extractListItems, extractSections, extractTables, htmlToText } = require("../html");

const TIME_RANGE = /(\d{1,2}\s*(?:h|:)\s*\d{0,2})\s*(?:-|–|—|\/|\bà\b|\ba\b|\bto\b)\s*(\d{1,2}\s*(?:h|:)\s*\d{0,2})/i;
const TIME_ONLY = /(?<![\d,.])\d{1,2}\s*(?:h|:)\s*\d{0,2}(?![\d])/i;
const LEVELS = ["tous niveaux", "debutant", "debutants", "initiation", "confirme", "confirmes", "intermediaire", "avance", "competition", "loisir", "libre"];
// Written accent-tolerant so they match the page exactly as published, accents kept.
const NOTE_PATTERNS = [
  /plannings?\s+am[eé]nag[eé][^.\n]*/i,
  /(?:fermeture|ferm[eé]e?s?)\s+(?:du|le|les|pendant|pour)[^.\n]*/i,
  /vacances\s+(?:scolaires|d['’][eé]t[eé]|de\s+no[eë]l)[^.\n]*/i,
  /(?:horaires?|plannings?)\s+(?:d['’])?(?:[eé]t[eé]|hiver|vacances)[^.\n]*/i,
  /(?:reprise|nouveau\s+planning)\s+(?:le|du|des)[^.\n]*/i,
];
const DAY_ALIAS_TO_ID = new Map(DAYS.flatMap((day) => day.aliases.map((alias) => [alias, day.id])));

function dayFromText(value) {
  const flat = ` ${flatten(value)} `;
  for (const [alias, id] of DAY_ALIAS_TO_ID) {
    if (flat.includes(` ${alias} `) || flat.includes(` ${alias}s `)) return id;
  }
  return null;
}

function cleanLabel(value) {
  return collapseWhitespace(String(value || "")
    .replace(/^[\s\-–—:·•*|,.]+/, "")
    .replace(/[\s\-–—:·•*|,]+$/, ""))
    .slice(0, 90);
}

function isLevelText(value) {
  const flat = flatten(value);
  return LEVELS.some((level) => flat.includes(level));
}

/**
 * Splits "Boxe thaï débutants (ados)" into discipline / level / audience.
 * Index math runs on normalize() output, which is character-for-character aligned
 * with the original, so accents and casing survive into the published text.
 */
function splitDetails(label) {
  const parenthetical = /\(([^)]{2,60})\)/.exec(label);
  const withoutParenthetical = cleanLabel(label.replace(/\([^)]*\)/g, " "));
  const normalized = normalize(withoutParenthetical);
  let level = null;
  let discipline = withoutParenthetical;
  for (const candidate of LEVELS) {
    const at = normalized.indexOf(candidate);
    if (at === -1) continue;
    const matched = withoutParenthetical.slice(at, at + candidate.length);
    if (!level || matched.length > level.length) {
      level = matched;
      discipline = `${withoutParenthetical.slice(0, at)} ${withoutParenthetical.slice(at + candidate.length)}`;
    }
  }
  const extra = parenthetical ? cleanLabel(parenthetical[1]) : null;
  const extraIsLevel = extra ? isLevelText(extra) : false;
  return {
    discipline: cleanLabel(discipline),
    level: cleanLabel(extraIsLevel ? extra : level || "") || null,
    audience: extra && !extraIsLevel ? extra : null,
  };
}

/** A single "18h30 - 20h00 Boxe anglaise (ados)" line. Returns null when it is not a session. */
function parseSessionLine(line, { day = null } = {}) {
  const text = collapseWhitespace(line);
  if (!text || text.length > 160) return null;
  const resolvedDay = dayFromText(text) || day;
  if (!resolvedDay) return null;
  const rangeMatch = TIME_RANGE.exec(text);
  const timeMatch = rangeMatch || TIME_ONLY.exec(text);
  if (!timeMatch) return null;
  const times = rangeMatch ? { start: parseTime(rangeMatch[1]), end: parseTime(rangeMatch[2]) } : { start: parseTime(timeMatch[0]), end: null };
  if (!times.start) return null;
  const dayAlias = DAYS.find((entry) => entry.id === resolvedDay)?.aliases || [];
  let remainder = text.slice(0, timeMatch.index) + text.slice(timeMatch.index + timeMatch[0].length);
  for (const alias of dayAlias) remainder = remainder.replace(new RegExp(`\\b${alias}s?\\b`, "gi"), " ");
  const { discipline, level, audience } = splitDetails(cleanLabel(remainder));
  if (!discipline || !/[a-zà-ÿ]{3}/i.test(discipline)) return null;
  return { day: resolvedDay, start: times.start, end: times.end, discipline, level, audience, evidence: text };
}

function fromSections(html) {
  const sessions = [];
  for (const section of extractSections(html)) {
    const day = dayFromText(section.heading);
    if (!day) continue;
    for (const line of section.text.split("\n")) {
      const session = parseSessionLine(line, { day });
      if (session) sessions.push(session);
    }
  }
  return sessions;
}

function fromListItems(html) {
  return extractListItems(html).map((item) => parseSessionLine(item)).filter(Boolean);
}

function fromPlainText(text) {
  const sessions = [];
  let currentDay = null;
  for (const line of String(text || "").split("\n")) {
    const trimmed = collapseWhitespace(line);
    if (!trimmed) continue;
    const dayHeading = dayFromText(trimmed);
    if (dayHeading && !TIME_ONLY.test(trimmed)) {
      currentDay = dayHeading;
      continue;
    }
    const session = parseSessionLine(trimmed, { day: currentDay });
    if (session) sessions.push(session);
  }
  return sessions;
}

/** Grid plannings: days as columns and hours in the first column, or the transpose. */
function fromTables(html) {
  const sessions = [];
  for (const table of extractTables(html)) {
    const headerCells = table.headers.length ? table.headers : (table.cells[0] || []).map((cell) => cell.text);
    const headerDays = headerCells.map(dayFromText);
    const headerDayCount = headerDays.filter(Boolean).length;
    const bodyRows = table.headers.length ? table.rows : table.cells.slice(1).map((row) => row.map((cell) => cell.text));

    if (headerDayCount >= 2) {
      for (const row of bodyRows) {
        const rowTime = parseTimeRange(row[0] || "");
        for (let column = 0; column < row.length; column += 1) {
          const day = headerDays[column];
          if (!day) continue;
          const cell = collapseWhitespace(row[column] || "");
          if (!cell || /^[-–—.·]*$/.test(cell)) continue;
          for (const piece of cell.split("\n")) {
            const cellTime = parseTimeRange(piece);
            const label = cellTime ? piece.replace(TIME_RANGE, " ").replace(TIME_ONLY, " ") : piece;
            const { discipline, level, audience } = splitDetails(cleanLabel(label));
            const start = cellTime?.start || rowTime?.start;
            if (!start || !discipline || !/[a-zà-ÿ]{3}/i.test(discipline)) continue;
            sessions.push({
              day,
              start,
              end: cellTime?.end || (cellTime ? null : rowTime?.end) || null,
              discipline,
              level,
              audience,
              evidence: collapseWhitespace(`${row[0] || ""} ${piece}`),
            });
          }
        }
      }
      continue;
    }

    for (const row of bodyRows) {
      const day = dayFromText(row[0] || "");
      if (!day) continue;
      for (const cell of row.slice(1)) {
        for (const piece of collapseWhitespace(cell || "").split("\n")) {
          const session = parseSessionLine(piece, { day });
          if (session) sessions.push(session);
        }
      }
    }
  }
  return sessions;
}

function fromJsonLd(html) {
  const sessions = [];
  for (const entry of extractJsonLd(html)) {
    const types = [entry["@type"]].flat().filter(Boolean).map(String);
    if (!types.some((type) => /event|course|schedule/i.test(type))) continue;
    const schedule = [entry.eventSchedule].flat().filter(Boolean);
    const name = collapseWhitespace(String(entry.name || entry.description || ""));
    if (!name) continue;
    for (const slot of schedule.length ? schedule : [entry]) {
      const days = [slot.byDay || slot.dayOfWeek].flat().filter(Boolean).map(String);
      const start = parseTime(String(slot.startTime || slot.startDate || "").replace(/^.*T/, "").replace(/^(\d{2}):(\d{2}).*$/, "$1:$2"));
      const end = parseTime(String(slot.endTime || slot.endDate || "").replace(/^.*T/, "").replace(/^(\d{2}):(\d{2}).*$/, "$1:$2"));
      for (const rawDay of days) {
        const day = dayFromText(rawDay.replace(/^https?:\/\/schema\.org\//, ""));
        if (!day || !start) continue;
        const { discipline, level, audience } = splitDetails(name);
        if (!discipline) continue;
        sessions.push({ day, start, end, discipline, level, audience, evidence: `JSON-LD ${name}` });
      }
    }
  }
  return sessions;
}

function extractNotes(text) {
  const notes = new Set();
  for (const pattern of NOTE_PATTERNS) {
    for (const line of String(text || "").split("\n")) {
      const match = pattern.exec(line);
      if (match) notes.add(collapseWhitespace(match[0]));
    }
  }
  return [...notes].slice(0, 6);
}

function extractSeason(text) {
  const match = /saison\s*(\d{4}\s*[-/]\s*\d{2,4})/i.exec(normalize(text));
  return match ? collapseWhitespace(match[1]).replace(/\s/g, "") : null;
}

/**
 * Every strategy runs and the results are merged: real planning pages mix a grid,
 * a list of exceptions, and a note about the summer schedule.
 */
function normalizePlanningDocument({ html = "", text = null, gymId = null, sourceId = null, sourceUrl = null } = {}) {
  const plainText = text || htmlToText(html);
  const strategies = [
    ["json-ld", () => fromJsonLd(html)],
    ["table", () => fromTables(html)],
    ["section", () => fromSections(html)],
    ["list", () => fromListItems(html)],
    ["text", () => fromPlainText(plainText)],
  ];
  const sessions = [];
  const usedStrategies = [];
  for (const [name, run] of strategies) {
    let found = [];
    try {
      found = run() || [];
    } catch {
      found = [];
    }
    if (found.length) usedStrategies.push({ strategy: name, count: found.length });
    sessions.push(...found);
  }
  return {
    gymId,
    sourceId,
    sourceUrl,
    season: extractSeason(plainText),
    notes: extractNotes(plainText),
    sessions,
    strategies: usedStrategies,
  };
}

module.exports = {
  dayFromText,
  extractNotes,
  extractSeason,
  fromJsonLd,
  fromListItems,
  fromPlainText,
  fromSections,
  fromTables,
  normalizePlanningDocument,
  parseSessionLine,
  splitDetails,
};
