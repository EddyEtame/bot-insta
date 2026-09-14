"use strict";

const { DAYS, dayById, displayTime, minutesOfDay, parseTime } = require("./calendar");
const { containsPhrase, flatten } = require("./text");

/**
 * Query words → the discipline family they point at. Used ONLY to match an intent
 * against sessions that were actually fetched; never to claim a gym teaches something.
 */
const DISCIPLINE_SYNONYMS = Object.freeze({
  "boxe-anglaise": ["boxe anglaise", "anglaise", "english boxing", "noble art"],
  "boxe-thai": ["boxe thai", "thai", "muay thai", "k1", "k 1", "kick boxing", "kickboxing", "boxe pieds poings"],
  mma: ["mma", "free fight", "cage", "arts martiaux mixtes"],
  grappling: ["grappling", "lutte", "jjb", "jiu jitsu", "sol", "no gi"],
  "cross-training": ["cross training", "crosstraining", "cross fit", "renfo", "renforcement", "prepa physique", "preparation physique"],
  hyrox: ["hyrox"],
  "boxing-fitness": ["boxing fitness", "fitness", "lady punch", "cardio boxe", "cardio boxing", "sac de frappe"],
  "boxe-educative": ["boxe educative", "educative", "enfant", "enfants", "kids", "ados", "adolescent", "jeunes"],
});

const AUDIENCE_PATTERNS = Object.freeze([
  { id: "enfants", pattern: /\b(enfant|enfants|kids|baby|eveil|poussin|benjamin)\b/ },
  { id: "ados", pattern: /\b(ado|ados|adolescent|adolescents|junior|juniors|cadet)\b/ },
  { id: "femmes", pattern: /\b(femme|femmes|lady|ladies|feminin|feminine)\b/ },
  { id: "competiteurs", pattern: /\b(competition|competiteur|competiteurs|pro|elite)\b/ },
  { id: "debutants", pattern: /\b(debutant|debutants|initiation|decouverte|beginner)\b/ },
]);

/** Every synonym, longest first: "boxing fitness" must win over "fitness", "boxe educative" over "educative". */
const SYNONYM_INDEX = Object.freeze(Object.entries(DISCIPLINE_SYNONYMS)
  .flatMap(([family, words]) => words.map((word) => ({ family, word })))
  .sort((left, right) => right.word.length - left.word.length));

/**
 * The discipline family a label belongs to, or null when it cannot be classified.
 * Null is deliberate: an unclassified session never matches a specific request,
 * so the bot stays silent instead of promising a discipline the club may not run there.
 */
function disciplineFamily(label) {
  const flat = flatten(label);
  if (!flat) return null;
  return SYNONYM_INDEX.find(({ word }) => containsPhrase(flat, word))?.family || null;
}

/** Discipline families named in a customer message. */
function detectDisciplines(text) {
  const flat = flatten(text);
  if (!flat) return [];
  const families = new Set();
  for (const { family, word } of SYNONYM_INDEX) {
    if (containsPhrase(flat, word)) families.add(family);
  }
  return Object.keys(DISCIPLINE_SYNONYMS).filter((family) => families.has(family));
}

function detectAudiences(text) {
  const flat = ` ${flatten(text)} `;
  return AUDIENCE_PATTERNS.filter(({ pattern }) => pattern.test(flat)).map(({ id }) => id);
}

function normalizeSession(raw) {
  const day = dayById(flatten(raw?.day)) || DAYS.find((entry) => entry.index === Number(raw?.dayIndex)) || null;
  const start = parseTime(raw?.start ?? raw?.time ?? "");
  const discipline = String(raw?.discipline || raw?.label || "").trim();
  if (!day || !start || !discipline) return null;
  const end = parseTime(raw?.end ?? "");
  return {
    day: day.id,
    dayIndex: day.index,
    start,
    end: end && minutesOfDay(end) > minutesOfDay(start) ? end : null,
    discipline,
    disciplineFamily: disciplineFamily(discipline),
    level: raw?.level ? String(raw.level).trim() : null,
    audience: raw?.audience ? String(raw.audience).trim() : null,
    coach: raw?.coach ? String(raw.coach).trim() : null,
    room: raw?.room ? String(raw.room).trim() : null,
  };
}

function sessionKey(session) {
  return [session.dayIndex, session.start, flatten(session.discipline), flatten(session.audience || "")].join("|");
}

function sortSessions(sessions) {
  return [...sessions].sort((left, right) =>
    left.dayIndex - right.dayIndex ||
    minutesOfDay(left.start) - minutesOfDay(right.start) ||
    left.discipline.localeCompare(right.discipline, "fr"));
}

function dedupeSessions(sessions) {
  const seen = new Map();
  for (const session of sessions) seen.set(sessionKey(session), session);
  return sortSessions([...seen.values()]);
}

function normalizePlanning(raw) {
  const sessions = dedupeSessions((Array.isArray(raw?.sessions) ? raw.sessions : []).map(normalizeSession).filter(Boolean));
  return {
    gymId: raw?.gymId ? String(raw.gymId) : null,
    sourceId: raw?.sourceId ? String(raw.sourceId) : null,
    sourceUrl: raw?.sourceUrl ? String(raw.sourceUrl) : null,
    season: raw?.season ? String(raw.season) : null,
    notes: (Array.isArray(raw?.notes) ? raw.notes : []).map((note) => String(note).trim()).filter(Boolean),
    sessions,
    days: [...new Set(sessions.map((session) => session.day))],
    disciplines: [...new Set(sessions.map((session) => session.discipline))],
  };
}

/** "7-12 ans", "dès 7 ans", "+16 ans" → the ages a session is written for. */
function parseAgeRange(text) {
  const flat = flatten(text);
  // flatten() has already turned "7-12 ans" into "7 12 ans", so the separator may be a space.
  const range = /(\d{1,2})\s*(?:[-–a]\s*|\s)(\d{1,2})\s*ans/.exec(flat);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const from = /(?:des|a partir de|\+)\s*(\d{1,2})\s*ans/.exec(flat);
  if (from) return { min: Number(from[1]), max: null };
  const single = /(\d{1,2})\s*ans/.exec(flat);
  return single ? { min: Number(single[1]), max: Number(single[1]) } : null;
}

/**
 * Whether a session is written for this audience. An age range counts: a parent asking
 * for "cours enfants" must find "Boxe éducative (7-12 ans)", which never says "enfant".
 */
function sessionMatchesAudience(session, audienceId) {
  const haystack = ` ${flatten(`${session.audience || ""} ${session.level || ""} ${session.discipline}`)} `;
  const rule = AUDIENCE_PATTERNS.find((entry) => entry.id === audienceId);
  if (rule?.pattern.test(haystack)) return true;
  const ages = parseAgeRange(`${session.audience || ""} ${session.discipline}`);
  if (audienceId === "enfants") {
    if (ages && (ages.max ?? ages.min) <= 14) return true;
    return session.disciplineFamily === "boxe-educative" && !ages;
  }
  if (audienceId === "ados") return Boolean(ages && (ages.max ?? 99) <= 18 && ages.min >= 11);
  return false;
}

function filterSessions(sessions, { days = [], disciplines = [], audiences = [] } = {}) {
  return sessions.filter((session) => {
    if (days.length && !days.includes(session.day)) return false;
    if (disciplines.length && !disciplines.includes(session.disciplineFamily)) return false;
    if (audiences.length && !audiences.some((audience) => sessionMatchesAudience(session, audience))) return false;
    return true;
  });
}

function renderSession(session) {
  const time = session.end ? `${displayTime(session.start)}–${displayTime(session.end)}` : displayTime(session.start);
  const details = [session.discipline, session.audience, session.level, session.coach ? `avec ${session.coach}` : null]
    .filter(Boolean)
    .join(" · ");
  return `${time} ${details}`;
}

/** Compact, scannable evidence text — one line per day, sessions separated by " | ". */
function renderPlanning(planning, { gymLabel, days = [], disciplines = [], audiences = [], maxDays = 7 } = {}) {
  const selected = filterSessions(planning.sessions, { days, disciplines, audiences });
  if (!selected.length) return "";
  const lines = [];
  const header = [gymLabel || planning.gymId, planning.season ? `saison ${planning.season}` : null].filter(Boolean).join(" — ");
  lines.push(`Planning ${header}`);
  const byDay = new Map();
  for (const session of sortSessions(selected)) {
    if (!byDay.has(session.day)) byDay.set(session.day, []);
    byDay.get(session.day).push(session);
  }
  for (const [day, daySessions] of [...byDay.entries()].slice(0, maxDays)) {
    lines.push(`${day.toUpperCase()} : ${daySessions.map(renderSession).join(" | ")}`);
  }
  for (const note of planning.notes) lines.push(note);
  return lines.join("\n");
}

/** One fact per gym+day, so two gyms claiming different Tuesday schedules cannot silently merge. */
function planningFacts(planning) {
  const byDay = new Map();
  for (const session of sortSessions(planning.sessions)) {
    if (!byDay.has(session.day)) byDay.set(session.day, []);
    byDay.get(session.day).push(renderSession(session));
  }
  return [...byDay.entries()].map(([day, entries]) => ({
    key: `planning_${planning.gymId}_${day}`,
    value: entries.join(" | "),
  }));
}

module.exports = {
  AUDIENCE_PATTERNS,
  DISCIPLINE_SYNONYMS,
  SYNONYM_INDEX,
  dedupeSessions,
  detectAudiences,
  detectDisciplines,
  disciplineFamily,
  filterSessions,
  normalizePlanning,
  normalizeSession,
  parseAgeRange,
  planningFacts,
  sessionMatchesAudience,
  renderPlanning,
  renderSession,
  sortSessions,
};
