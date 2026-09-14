"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { containsPhrase, flatten, slugify } = require("./text");

/** "SAINT-CYPRIEN" → "Saint-Cyprien": the print spelling, written the way a DM reads. */
function titleCase(value) {
  return String(value || "")
    .split(/([\s-])/)
    .map((part) => (/^[\s-]$/.test(part) || !part
      ? part
      : part.charAt(0).toLocaleUpperCase("fr-FR") + part.slice(1).toLocaleLowerCase("fr-FR")))
    .join("");
}

const DOC_TYPES = Object.freeze(["profile", "planning", "offer"]);
const SOURCE_KINDS = Object.freeze(["url", "file"]);

function registryPath(config) {
  return path.join(config.knowledgeBasePath, "registry", "gyms.json");
}

function normalizeSource(raw, { gymId = null, errors, index }) {
  const label = gymId ? `${gymId}.sources[${index}]` : `clubSources[${index}]`;
  const kind = String(raw?.kind || "url");
  const docType = String(raw?.docType || "");
  if (!SOURCE_KINDS.includes(kind)) errors.push(`${label}: unknown source kind "${kind}"`);
  if (!DOC_TYPES.includes(docType)) errors.push(`${label}: unknown docType "${docType}"`);
  const id = String(raw?.id || `${gymId || "club"}-${docType}-${index}`);
  const candidates = Array.isArray(raw?.candidates) ? raw.candidates.map(String).filter(Boolean) : [];
  return {
    id,
    gymId,
    docType,
    kind,
    url: raw?.url ? String(raw.url) : null,
    file: raw?.file ? String(raw.file) : null,
    candidates,
    required: raw?.required === true,
    // Per-source overrides: a season planning handed over as a file does not expire
    // on the same clock as a web page that can change silently.
    maxAgeDays: Number.isFinite(Number(raw?.maxAgeDays)) ? Number(raw.maxAgeDays) : null,
    effectiveFrom: raw?.effectiveFrom ? String(raw.effectiveFrom) : null,
    effectiveUntil: raw?.effectiveUntil ? String(raw.effectiveUntil) : null,
    label: raw?.label ? String(raw.label) : null,
  };
}

function normalizeGym(raw, errors, index) {
  const id = String(raw?.id || slugify(raw?.name || `gym-${index}`));
  if (!id) errors.push(`gyms[${index}]: missing id`);
  const aliasSet = new Set([id, raw?.name, raw?.displayName, ...(raw?.aliases || [])]
    .filter(Boolean)
    .map((alias) => flatten(alias))
    .filter(Boolean));
  const sources = (Array.isArray(raw?.sources) ? raw.sources : [])
    .map((source, sourceIndex) => normalizeSource(source, { gymId: id, errors, index: sourceIndex }));
  const displayName = String(raw?.displayName || raw?.name || id);
  return {
    id,
    name: String(raw?.name || raw?.displayName || id),
    displayName,
    label: titleCase(displayName),
    commune: raw?.commune ? String(raw.commune) : null,
    status: String(raw?.status || "active"),
    repo: raw?.repo ? String(raw.repo) : null,
    aliases: [...aliasSet].sort((left, right) => right.length - left.length),
    sources,
  };
}

class GymRegistry {
  constructor({ club, gyms, clubSources, hostAllowlist, errors, filePath }) {
    this.club = club;
    this.gyms = gyms;
    this.clubSources = clubSources;
    this.hostAllowlist = hostAllowlist;
    this.errors = errors;
    this.filePath = filePath;
    this.byId = new Map(gyms.map((gym) => [gym.id, gym]));
  }

  get(id) {
    return this.byId.get(String(id || "")) || null;
  }

  label(id) {
    return this.get(id)?.label || String(id || "");
  }

  activeGyms() {
    return this.gyms.filter((gym) => gym.status === "active");
  }

  allSources() {
    return [...this.clubSources, ...this.gyms.flatMap((gym) => gym.sources)];
  }

  sourceById(id) {
    return this.allSources().find((source) => source.id === id) || null;
  }

  /** Gym ids explicitly named in a message, registry order preserved. */
  detect(text) {
    const flat = flatten(text);
    if (!flat) return [];
    return this.gyms.filter((gym) => gym.aliases.some((alias) => containsPhrase(flat, alias))).map((gym) => gym.id);
  }

  /** True when the message is about the whole club rather than one room. */
  mentionsAllGyms(text) {
    return /\b(toutes? les salles|tous les clubs|partout|chaque salle|n ?importe quelle salle|all (the )?(gyms|clubs)|every (gym|club)|\d+ salles)\b/.test(flatten(text));
  }
}

function parseRegistry(raw, filePath) {
  const errors = [];
  const gyms = (Array.isArray(raw?.gyms) ? raw.gyms : []).map((gym, index) => normalizeGym(gym, errors, index));
  if (!gyms.length) errors.push("registry: no gym declared");
  // A commune only names a club when it names exactly one: three clubs sit in Toulouse.
  const communeCount = new Map();
  for (const gym of gyms) {
    const commune = flatten(gym.commune || "");
    if (commune) communeCount.set(commune, (communeCount.get(commune) || 0) + 1);
  }
  for (const gym of gyms) {
    const commune = flatten(gym.commune || "");
    if (commune && communeCount.get(commune) === 1 && !gym.aliases.includes(commune)) {
      gym.aliases = [...gym.aliases, commune].sort((left, right) => right.length - left.length);
    }
  }
  const duplicates = gyms.map((gym) => gym.id).filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicates.length) errors.push(`registry: duplicate gym ids ${[...new Set(duplicates)].join(", ")}`);
  const clubSources = (Array.isArray(raw?.clubSources) ? raw.clubSources : [])
    .map((source, index) => normalizeSource(source, { gymId: null, errors, index }));
  const declaredCount = Number(raw?.club?.gymCount);
  if (Number.isInteger(declaredCount) && declaredCount !== gyms.length) {
    errors.push(`registry: club.gymCount is ${declaredCount} but ${gyms.length} gyms are declared`);
  }
  return new GymRegistry({
    club: raw?.club || {},
    gyms,
    clubSources,
    hostAllowlist: (Array.isArray(raw?.hostAllowlist) ? raw.hostAllowlist : []).map((host) => String(host).toLowerCase()),
    errors,
    filePath,
  });
}

function loadGymRegistry(config) {
  const filePath = registryPath(config);
  if (!fs.existsSync(filePath)) {
    return new GymRegistry({ club: {}, gyms: [], clubSources: [], hostAllowlist: [], errors: [`registry: ${filePath} not found`], filePath });
  }
  try {
    return parseRegistry(JSON.parse(fs.readFileSync(filePath, "utf8")), filePath);
  } catch (err) {
    return new GymRegistry({ club: {}, gyms: [], clubSources: [], hostAllowlist: [], errors: [`registry: ${err.message}`], filePath });
  }
}

module.exports = { DOC_TYPES, GymRegistry, loadGymRegistry, parseRegistry, registryPath, titleCase };
