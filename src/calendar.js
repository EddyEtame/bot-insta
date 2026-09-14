"use strict";

const { flatten, normalize } = require("./text");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Weekday index follows JavaScript: 0 = dimanche. */
const DAYS = Object.freeze([
  { id: "dimanche", index: 0, fr: "dimanche", en: "sunday", aliases: ["dimanche", "sunday", "dim"] },
  { id: "lundi", index: 1, fr: "lundi", en: "monday", aliases: ["lundi", "monday", "lun"] },
  { id: "mardi", index: 2, fr: "mardi", en: "tuesday", aliases: ["mardi", "tuesday", "mar"] },
  { id: "mercredi", index: 3, fr: "mercredi", en: "wednesday", aliases: ["mercredi", "wednesday", "mer"] },
  { id: "jeudi", index: 4, fr: "jeudi", en: "thursday", aliases: ["jeudi", "thursday", "jeu"] },
  { id: "vendredi", index: 5, fr: "vendredi", en: "friday", aliases: ["vendredi", "friday", "ven"] },
  { id: "samedi", index: 6, fr: "samedi", en: "saturday", aliases: ["samedi", "saturday", "sam"] },
]);

const DAY_BY_ALIAS = new Map();
for (const day of DAYS) {
  for (const alias of day.aliases) DAY_BY_ALIAS.set(alias, day);
}

function dayById(id) {
  return DAYS.find((day) => day.id === id) || null;
}

function dayByIndex(index) {
  return DAYS.find((day) => day.index === index) || null;
}

/** Days explicitly named in a message, in week order. "le week-end" expands to samedi + dimanche. */
function detectDays(text) {
  const flat = ` ${flatten(text)} `;
  const found = new Set();
  for (const [alias, day] of DAY_BY_ALIAS) {
    if (flat.includes(` ${alias} `) || flat.includes(` ${alias}s `)) found.add(day.id);
  }
  if (/\b(week ?end|weekend|we)\b/.test(flat)) {
    found.add("samedi");
    found.add("dimanche");
  }
  return DAYS.filter((day) => found.has(day.id)).map((day) => day.id);
}

/**
 * "18h30", "18 h 30", "18:30", "9h" → "18:30" / "09:00". Returns null when unparsable.
 * Only "h" and ":" separate hours from minutes: a dot would turn the price "29.99 €"
 * and the age range "7.12 ans" into schedules.
 */
function parseTime(value) {
  const match = normalize(value).match(/(?<![\d,.])(\d{1,2})\s*(?:h|:)\s*(\d{2})?(?![\d])/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  if (!Number.isInteger(hours) || hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseTimeRange(value) {
  const text = normalize(value);
  const parts = text.split(/\s*(?:-|–|—|a|à|to|\/)\s*/).map((part) => part.trim()).filter(Boolean);
  const times = parts.map(parseTime).filter(Boolean);
  if (!times.length) return null;
  return { start: times[0], end: times.length > 1 ? times[1] : null };
}

function minutesOfDay(time) {
  const match = String(time || "").match(/^(\d{2}):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Human form used in replies: "18:30" → "18h30", "10:00" → "10h". */
function displayTime(time) {
  const match = String(time || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return String(time || "");
  const hours = String(Number(match[1]));
  return match[2] === "00" ? `${hours}h` : `${hours}h${match[2]}`;
}

function zonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: weekdayIndex,
  };
}

function zoneOffsetMs(date, timeZone) {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

/** Converts a wall-clock time in `timeZone` to the matching UTC instant, DST included. */
function fromZonedWallClock({ year, month, day, hour = 0, minute = 0 }, timeZone) {
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const candidate = target - zoneOffsetMs(new Date(instant), timeZone);
    if (candidate === instant) break;
    instant = candidate;
  }
  return new Date(instant);
}

/**
 * Next occurrence of a weekly wall-clock slot, strictly after `from`.
 * weekday follows DAYS (0 = dimanche), so the Sunday poll is weekday 0.
 */
function nextWeeklyRun(from, { weekday = 0, hour = 4, minute = 30, timeZone = "Europe/Paris" } = {}) {
  const start = from instanceof Date ? from : new Date(from);
  const local = zonedParts(start, timeZone);
  for (let offset = 0; offset <= 8; offset += 1) {
    const dayCursor = new Date(Date.UTC(local.year, local.month - 1, local.day) + offset * MS_PER_DAY);
    const cursorParts = {
      year: dayCursor.getUTCFullYear(),
      month: dayCursor.getUTCMonth() + 1,
      day: dayCursor.getUTCDate(),
    };
    const candidate = fromZonedWallClock({ ...cursorParts, hour, minute }, timeZone);
    if (zonedParts(candidate, timeZone).weekday !== weekday) continue;
    if (candidate.getTime() > start.getTime()) return candidate;
  }
  throw new Error("Unable to compute the next weekly run.");
}

function isoDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function ageInDays(isoTimestamp, now = new Date()) {
  const then = Date.parse(isoTimestamp);
  if (!Number.isFinite(then)) return null;
  return (now.getTime() - then) / MS_PER_DAY;
}

module.exports = {
  DAYS,
  MS_PER_DAY,
  ageInDays,
  dayById,
  dayByIndex,
  detectDays,
  displayTime,
  fromZonedWallClock,
  isoDate,
  minutesOfDay,
  nextWeeklyRun,
  parseTime,
  parseTimeRange,
  zonedParts,
  zoneOffsetMs,
};
