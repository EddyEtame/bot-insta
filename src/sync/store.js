"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const GENERATED_DIRECTORY = "generated";

function hashContent(value) {
  return crypto.createHash("sha256").update(String(value ?? "")).digest("hex");
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

/** Write through a temporary file so a crash never leaves a half-written corpus file. */
function atomicWrite(filePath, contents) {
  ensureDirectory(path.dirname(filePath));
  const temporary = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, contents);
  fs.renameSync(temporary, filePath);
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  atomicWrite(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createStore(config) {
  const base = config.knowledgeBasePath;
  const paths = {
    base,
    raw: path.join(base, "raw"),
    normalized: path.join(base, "normalized"),
    source: path.join(base, "source"),
    generated: path.join(base, "source", GENERATED_DIRECTORY),
    metadata: path.join(base, "metadata"),
    indexes: path.join(base, "indexes"),
    state: path.join(base, "metadata", "fetch-state.json"),
    changelog: path.join(base, "metadata", "changelog.jsonl"),
    report: path.join(base, "metadata", "last-sync.json"),
    lock: path.join(base, "metadata", "sync.lock"),
  };

  function loadState() {
    const state = readJson(paths.state, null);
    return state && typeof state === "object" ? state : { version: 1, sources: {} };
  }

  function saveState(state) {
    writeJson(paths.state, state);
  }

  function snapshot(sourceId, body, { keep = config.sync.keepSnapshots, at = new Date() } = {}) {
    const directory = path.join(paths.raw, sourceId.replace(/[^a-z0-9_-]+/gi, "-"));
    ensureDirectory(directory);
    const stamp = at.toISOString().replace(/[:.]/g, "-");
    const file = path.join(directory, `${stamp}.snapshot`);
    atomicWrite(file, body);
    const existing = fs.readdirSync(directory).filter((name) => name.endsWith(".snapshot")).sort();
    for (const stale of existing.slice(0, Math.max(0, existing.length - keep))) {
      fs.rmSync(path.join(directory, stale), { force: true });
    }
    return file;
  }

  function writeNormalized(scope, docType, record) {
    const file = path.join(paths.normalized, scope, `${docType}.json`);
    writeJson(file, record);
    return file;
  }

  function readNormalized(scope, docType) {
    return readJson(path.join(paths.normalized, scope, `${docType}.json`), null);
  }

  function writeSourceDocument(document) {
    const file = path.join(paths.generated, `${document.metadata.id}.json`);
    writeJson(file, document);
    return file;
  }

  function listGeneratedSources() {
    if (!fs.existsSync(paths.generated)) return [];
    return fs.readdirSync(paths.generated).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, ""));
  }

  function removeSourceDocument(id) {
    const file = path.join(paths.generated, `${id}.json`);
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
      return true;
    }
    return false;
  }

  function appendChangelog(entries) {
    const rows = [entries].flat().filter(Boolean);
    if (!rows.length) return 0;
    ensureDirectory(path.dirname(paths.changelog));
    fs.appendFileSync(paths.changelog, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
    return rows.length;
  }

  function readChangelog({ limit = 50 } = {}) {
    if (!fs.existsSync(paths.changelog)) return [];
    return fs.readFileSync(paths.changelog, "utf8")
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
  }

  function writeReport(report) {
    writeJson(paths.report, report);
    return paths.report;
  }

  function readReport() {
    return readJson(paths.report, null);
  }

  /** Cooperative lock so a manual run and the weekly run never write the corpus at once. */
  function acquireLock({ owner = `pid:${process.pid}`, staleMs = 30 * 60 * 1000, at = Date.now() } = {}) {
    ensureDirectory(path.dirname(paths.lock));
    const existing = readJson(paths.lock, null);
    if (existing && at - Date.parse(existing.at || 0) < staleMs) return null;
    const token = crypto.randomUUID();
    writeJson(paths.lock, { owner, token, at: new Date(at).toISOString() });
    const confirmed = readJson(paths.lock, null);
    if (confirmed?.token !== token) return null;
    return {
      token,
      release() {
        const current = readJson(paths.lock, null);
        if (current?.token === token) fs.rmSync(paths.lock, { force: true });
      },
    };
  }

  return {
    paths,
    acquireLock,
    appendChangelog,
    listGeneratedSources,
    loadState,
    readChangelog,
    readNormalized,
    readReport,
    removeSourceDocument,
    saveState,
    snapshot,
    writeNormalized,
    writeReport,
    writeSourceDocument,
  };
}

module.exports = { atomicWrite, createStore, ensureDirectory, hashContent, readJson, writeJson };
