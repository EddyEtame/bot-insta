"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { DAYS, ageInDays, dayById, detectDays } = require("./calendar");
const { loadGymRegistry } = require("./gyms");
const { detectAudiences, detectDisciplines } = require("./planning");
const { containsPhrase, flatten, normalize, tokens } = require("./text");

const PUBLIC_STATUSES = new Set(["verified", "verified_public", "approved"]);
const DOC_TYPE_INTENT = Object.freeze({
  planning: /(planning|horaire|horaires|creneau|creneaux|cours|seance|seances|entrainement|entrainements|quand|quel jour|schedule|timetable|class|classes)/,
  offer: /(prix|tarif|tarifs|cout|combien|offre|offres|abonnement|inscription|promo|promotion|engagement|payer|paiement|price|cost|membership|subscription|deal)/,
  profile: /(adresse|ou (?:est|se trouve|sont)|acces|parking|metro|telephone|contact|ouvert|ouverture|ferme|fermeture|horaires d ouverture|address|where|open|opening|phone)/,
});

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  });
}

function parseFrontMatter(source) {
  if (!source.startsWith("---\n")) return { metadata: {}, content: source };
  const end = source.indexOf("\n---", 4);
  if (end === -1) return { metadata: {}, content: source };
  const metadata = {};
  for (const line of source.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    try {
      metadata[key] = value.startsWith("[") || value.startsWith("{") ? JSON.parse(value) : value;
    } catch {
      metadata[key] = value;
    }
  }
  return { metadata, content: source.slice(end + 4).trim() };
}

function readSource(filePath, sourceDirectory) {
  const raw = fs.readFileSync(filePath, "utf8");
  const extension = path.extname(filePath).toLowerCase();
  let metadata;
  let content;
  if (extension === ".json") {
    const parsed = JSON.parse(raw);
    metadata = parsed.metadata || {};
    content = parsed.content || parsed.text || "";
  } else {
    ({ metadata, content } = parseFrontMatter(raw));
  }
  const relativePath = path.relative(sourceDirectory, filePath).replaceAll("\\", "/");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return {
    id: String(metadata.id || relativePath.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "")).toLowerCase(),
    title: String(metadata.title || path.basename(filePath, extension)),
    sourceFile: relativePath,
    sourceType: String(metadata.sourceType || extension.slice(1) || "text"),
    sourceUrl: metadata.sourceUrl ? String(metadata.sourceUrl) : null,
    visibility: String(metadata.visibility || "internal"),
    verificationStatus: String(metadata.verificationStatus || "unverified"),
    priority: Number(metadata.priority || 0),
    language: String(metadata.language || "fr"),
    effectiveFrom: metadata.effectiveFrom ? String(metadata.effectiveFrom) : null,
    effectiveUntil: metadata.effectiveUntil ? String(metadata.effectiveUntil) : null,
    docType: metadata.docType ? String(metadata.docType) : null,
    gyms: Array.isArray(metadata.gyms) ? metadata.gyms.map(String) : [],
    generated: metadata.generated === true,
    checkedAt: metadata.checkedAt ? String(metadata.checkedAt) : null,
    capturedAt: metadata.capturedAt ? String(metadata.capturedAt) : null,
    maxAgeDays: Number.isFinite(Number(metadata.maxAgeDays)) ? Number(metadata.maxAgeDays) : null,
    topics: Array.isArray(metadata.topics) ? metadata.topics.map(String) : [],
    facts: Array.isArray(metadata.facts) ? metadata.facts.filter((fact) => fact && fact.key && fact.value) : [],
    hash,
    content: String(content).trim(),
  };
}

function splitIntoChunks(document) {
  const paragraphs = document.content.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const groups = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > 850) {
      groups.push(current);
      current = "";
    }
    current = `${current}${current ? "\n\n" : ""}${paragraph}`;
  }
  return (groups.length ? groups : [document.content]).map((content, index) => ({
    ...document,
    chunkId: `${document.id}:${index + 1}`,
    content,
    tokenSet: new Set(tokens(`${document.title} ${document.topics.join(" ")} ${content}`)),
  }));
}

function detectConflicts(chunks) {
  const values = new Map();
  for (const chunk of chunks) {
    for (const fact of chunk.facts) {
      const key = String(fact.key);
      const value = normalize(fact.value);
      if (!values.has(key)) values.set(key, new Map());
      values.get(key).set(value, { value: fact.value, sourceId: chunk.id });
    }
  }
  return [...values.entries()]
    .filter(([, valueMap]) => valueMap.size > 1)
    .map(([key, valueMap]) => ({ key, values: [...valueMap.values()] }));
}

/** What the customer is asking about: which club, which day, which discipline, which kind of fact. */
function analyzeQuery(text, registry) {
  const flat = flatten(text);
  const wanted = Object.entries(DOC_TYPE_INTENT)
    .filter(([, pattern]) => pattern.test(flat))
    .map(([docType]) => docType);
  return {
    gymIds: registry ? registry.detect(text) : [],
    mentionsAllGyms: registry ? registry.mentionsAllGyms(text) : false,
    days: detectDays(text),
    disciplines: detectDisciplines(text),
    audiences: detectAudiences(text),
    docTypes: wanted,
    wantsPlanning: wanted.includes("planning"),
    wantsOffer: wanted.includes("offer"),
    wantsProfile: wanted.includes("profile"),
  };
}

/** Keeps the header, the requested days and the closing notes: a DM should not carry a full week. */
function focusPlanningContent(content, days) {
  if (!days.length) return content;
  const lines = content.split("\n");
  const dayLabels = new Set(days.map((day) => dayById(day)?.fr.toUpperCase()).filter(Boolean));
  const isDayLine = (line) => DAYS.some((day) => line.toUpperCase().startsWith(`${day.fr.toUpperCase()} :`));
  const kept = lines.filter((line, index) => index === 0 || !isDayLine(line) || [...dayLabels].some((label) => line.toUpperCase().startsWith(`${label} :`)));
  return kept.some(isDayLine) ? kept.join("\n") : content;
}

class KnowledgeBase {
  constructor({ sourceDirectory, personaPath, documents, loadErrors, registry, freshness, loadedAt = new Date() }) {
    this.sourceDirectory = sourceDirectory;
    this.personaPath = personaPath;
    this.documents = documents;
    this.chunks = documents.flatMap(splitIntoChunks);
    this.loadErrors = loadErrors;
    this.registry = registry;
    this.freshness = freshness || {};
    this.loadedAt = loadedAt;
    this.persona = fs.existsSync(personaPath) ? fs.readFileSync(personaPath, "utf8").trim() : "";
  }

  maxAgeFor(chunk) {
    if (Number.isFinite(chunk.maxAgeDays)) return chunk.maxAgeDays;
    return chunk.docType ? this.freshness[chunk.docType] ?? null : null;
  }

  /** A fetched fact past its freshness budget is not evidence any more. */
  stalenessOf(chunk, now) {
    const maxAge = this.maxAgeFor(chunk);
    if (!chunk.checkedAt || !Number.isFinite(maxAge)) return { stale: false, ageDays: null, maxAgeDays: maxAge };
    const age = ageInDays(chunk.checkedAt, now);
    return { stale: age !== null && age > maxAge, ageDays: age, maxAgeDays: maxAge };
  }

  retrieve(query, { limit = 4, maxCharacters = 2_400, now = new Date() } = {}) {
    const analysis = analyzeQuery(query, this.registry);
    const queryTokens = new Set(tokens(query));
    const today = now.toISOString().slice(0, 10);
    const stale = [];
    const wrongGym = [];

    const candidates = this.chunks
      .filter((chunk) => chunk.visibility === "public")
      .filter((chunk) => PUBLIC_STATUSES.has(chunk.verificationStatus))
      .filter((chunk) => !chunk.effectiveFrom || chunk.effectiveFrom <= today)
      .filter((chunk) => !chunk.effectiveUntil || chunk.effectiveUntil >= today)
      .filter((chunk) => {
        // A Balma planning must never answer a Portet question, however well it scores.
        const chunkGyms = chunk.gyms || [];
        if (!analysis.gymIds.length || !chunkGyms.length) return true;
        const matches = chunkGyms.some((gymId) => analysis.gymIds.includes(gymId));
        if (!matches) wrongGym.push(chunk.id);
        return matches;
      })
      .filter((chunk) => {
        const freshness = this.stalenessOf(chunk, now);
        if (freshness.stale) {
          stale.push({ id: chunk.id, docType: chunk.docType, checkedAt: chunk.checkedAt, ageDays: Math.round(freshness.ageDays), maxAgeDays: freshness.maxAgeDays });
        }
        return !freshness.stale;
      })
      .map((chunk) => {
        const overlap = [...queryTokens].filter((token) => chunk.tokenSet.has(token)).length;
        const phraseBoost = containsPhrase(chunk.content, query) ? 2 : 0;
        const topicBoost = chunk.topics.some((topic) => containsPhrase(query, topic)) ? 2 : 0;
        const gymBoost = analysis.gymIds.length && (chunk.gyms || []).some((gymId) => analysis.gymIds.includes(gymId)) ? 6 : 0;
        const typeBoost = chunk.docType && analysis.docTypes.includes(chunk.docType) ? 4 : 0;
        const dayBoost = chunk.docType === "planning" && analysis.days.some((day) => containsPhrase(chunk.content, day)) ? 3 : 0;
        const disciplineBoost = analysis.disciplines.length && chunk.docType === "planning" ? 1 : 0;
        const matchScore = overlap * 3 + phraseBoost + topicBoost + gymBoost + typeBoost + dayBoost + disciplineBoost;
        return { ...chunk, matchScore, score: matchScore + Math.min(chunk.priority, 100) / 100 };
      })
      .filter((chunk) => chunk.matchScore > 0)
      .sort((left, right) => right.score - left.score || right.priority - left.priority || left.id.localeCompare(right.id));

    const selected = [];
    let characters = 0;
    const sourceIds = new Set();
    for (const chunk of candidates) {
      if (selected.length >= limit || sourceIds.has(chunk.id)) continue;
      const content = chunk.docType === "planning" ? focusPlanningContent(chunk.content, analysis.days) : chunk.content;
      if (characters + content.length > maxCharacters) continue;
      selected.push({ ...chunk, content });
      sourceIds.add(chunk.id);
      characters += content.length;
    }

    const conflicts = detectConflicts(selected);
    const topScore = selected[0]?.score || 0;
    const gymSpecificDocs = new Set(this.chunks.flatMap((chunk) => chunk.gyms || []));
    const needsGym = !analysis.gymIds.length
      && !analysis.mentionsAllGyms
      && (analysis.wantsPlanning || analysis.wantsProfile)
      && gymSpecificDocs.size > 1;

    return {
      query,
      analysis,
      chunks: selected.map(({ tokenSet, ...chunk }) => chunk),
      sources: [...sourceIds],
      confidence: selected.length && !conflicts.length ? Math.min(0.95, 0.35 + topScore / 15) : 0,
      conflicts,
      hasEvidence: selected.length > 0,
      staleSources: stale,
      wrongGymSources: [...new Set(wrongGym)],
      needsGym,
    };
  }

  freshnessReport(now = new Date()) {
    const fetched = this.documents.filter((document) => document.checkedAt);
    const staleDocuments = fetched.filter((document) => this.stalenessOf(document, now).stale);
    const oldest = fetched.reduce((worst, document) => (!worst || document.checkedAt < worst.checkedAt ? document : worst), null);
    return {
      fetchedSourceCount: fetched.length,
      staleSourceCount: staleDocuments.length,
      staleSourceIds: staleDocuments.map((document) => document.id),
      oldestCheckedAt: oldest?.checkedAt || null,
      oldestAgeDays: oldest ? Math.round(ageInDays(oldest.checkedAt, now)) : null,
    };
  }

  coverage() {
    const gyms = this.registry ? this.registry.activeGyms() : [];
    return gyms.map((gym) => {
      const documents = this.documents.filter((document) => (document.gyms || []).includes(gym.id));
      return {
        gymId: gym.id,
        displayName: gym.displayName,
        docTypes: [...new Set(documents.map((document) => document.docType).filter(Boolean))],
        hasPlanning: documents.some((document) => document.docType === "planning"),
        hasProfile: documents.some((document) => document.docType === "profile"),
        sourceCount: documents.length,
      };
    });
  }

  getStatus(now = new Date()) {
    const publicDocuments = this.documents.filter((document) => document.visibility === "public" && PUBLIC_STATUSES.has(document.verificationStatus));
    const coverage = this.coverage();
    return {
      sourceDirectory: this.sourceDirectory,
      sourceCount: this.documents.length,
      publicSourceCount: publicDocuments.length,
      loadErrors: this.loadErrors.length,
      registryErrors: this.registry?.errors?.length || 0,
      gymCount: coverage.length,
      gymsWithPlanning: coverage.filter((entry) => entry.hasPlanning).length,
      gymsWithProfile: coverage.filter((entry) => entry.hasProfile).length,
      loadedAt: this.loadedAt.toISOString(),
      ...this.freshnessReport(now),
    };
  }

  manifest() {
    return this.documents.map(({ content, ...document }) => document);
  }
}

function loadKnowledgeBase(config, { registry = null } = {}) {
  const sourceDirectory = path.join(config.knowledgeBasePath, "source");
  const personaPath = path.join(config.knowledgeBasePath, "rules", "persona.md");
  const loadErrors = [];
  const documents = walk(sourceDirectory)
    .filter((filePath) => [".md", ".txt", ".json"].includes(path.extname(filePath).toLowerCase()))
    .flatMap((filePath) => {
      try {
        const document = readSource(filePath, sourceDirectory);
        if (!document.content) throw new Error("Source content is empty");
        return [document];
      } catch (err) {
        loadErrors.push({ file: path.relative(sourceDirectory, filePath), message: err.message });
        return [];
      }
    });
  return new KnowledgeBase({
    sourceDirectory,
    personaPath,
    documents,
    loadErrors,
    registry: registry || loadGymRegistry(config),
    freshness: config.freshness,
  });
}

module.exports = { KnowledgeBase, analyzeQuery, focusPlanningContent, loadKnowledgeBase, tokens };
