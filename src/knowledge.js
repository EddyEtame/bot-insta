"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_STATUSES = new Set(["verified", "verified_public", "approved"]);
const STOP_WORDS = new Set([
  "a", "au", "aux", "avec", "ce", "ces", "cette", "comme", "dans", "de", "des", "du", "en", "est", "et", "il", "je", "la", "le", "les", "ma", "mes", "mon", "nous", "ou", "par", "pas", "pour", "que", "qui", "sur", "tu", "un", "une", "vos", "you", "the", "and", "for", "with", "what", "how", "is", "it", "to",
]);

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

function tokens(text) {
  return [...new Set(normalize(text).match(/[a-z0-9€]+/g) || [])]
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

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
  if (current) groups.push(current);
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

class KnowledgeBase {
  constructor({ sourceDirectory, personaPath, documents, loadErrors }) {
    this.sourceDirectory = sourceDirectory;
    this.personaPath = personaPath;
    this.documents = documents;
    this.chunks = documents.flatMap(splitIntoChunks);
    this.loadErrors = loadErrors;
    this.persona = fs.existsSync(personaPath) ? fs.readFileSync(personaPath, "utf8").trim() : "";
  }

  retrieve(query, { limit = 4, maxCharacters = 2_400 } = {}) {
    const queryTokens = new Set(tokens(query));
    const today = new Date().toISOString().slice(0, 10);
    const ranked = this.chunks
      .filter((chunk) => chunk.visibility === "public")
      .filter((chunk) => PUBLIC_STATUSES.has(chunk.verificationStatus))
      .filter((chunk) => !chunk.effectiveFrom || chunk.effectiveFrom <= today)
      .filter((chunk) => !chunk.effectiveUntil || chunk.effectiveUntil >= today)
      .map((chunk) => {
        const overlap = [...queryTokens].filter((token) => chunk.tokenSet.has(token)).length;
        const phraseBoost = normalize(chunk.content).includes(normalize(query).trim()) ? 2 : 0;
        const topicBoost = chunk.topics.some((topic) => normalize(query).includes(normalize(topic))) ? 2 : 0;
        const matchScore = overlap * 3 + phraseBoost + topicBoost;
        return { ...chunk, matchScore, score: matchScore + Math.min(chunk.priority, 100) / 100 };
      })
      .filter((chunk) => chunk.matchScore > 0)
      .sort((left, right) => right.score - left.score || right.priority - left.priority || left.id.localeCompare(right.id));

    const selected = [];
    let characters = 0;
    const sourceIds = new Set();
    for (const chunk of ranked) {
      if (selected.length >= limit || sourceIds.has(chunk.id) || characters + chunk.content.length > maxCharacters) continue;
      selected.push(chunk);
      sourceIds.add(chunk.id);
      characters += chunk.content.length;
    }
    const conflicts = detectConflicts(selected);
    const topScore = selected[0]?.score || 0;
    const confidence = selected.length && !conflicts.length ? Math.min(0.95, 0.35 + topScore / 15) : 0;
    return {
      query,
      chunks: selected.map(({ tokenSet, ...chunk }) => chunk),
      sources: [...sourceIds],
      confidence,
      conflicts,
      hasEvidence: selected.length > 0,
    };
  }

  getStatus() {
    return {
      sourceDirectory: this.sourceDirectory,
      sourceCount: this.documents.length,
      publicSourceCount: this.documents.filter((document) => document.visibility === "public" && PUBLIC_STATUSES.has(document.verificationStatus)).length,
      loadErrors: this.loadErrors.length,
    };
  }

  manifest() {
    return this.documents.map(({ content, ...document }) => document);
  }
}

function loadKnowledgeBase(config) {
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
  return new KnowledgeBase({ sourceDirectory, personaPath, documents, loadErrors });
}

module.exports = { KnowledgeBase, loadKnowledgeBase, tokens };
