"use strict";

const MAX_REDIRECTS = 5;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

class FetchError extends Error {
  constructor(message, { status = null, url = null, retryable = false } = {}) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.url = url;
    this.retryable = retryable;
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** A host is allowed when it equals an allowlisted host or is one of its subdomains. */
function isHostAllowed(url, allowlist) {
  const host = hostOf(url);
  if (!host) return false;
  return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function charsetOf(contentType) {
  const match = /charset=([a-z0-9_-]+)/i.exec(contentType || "");
  const raw = (match?.[1] || "utf-8").toLowerCase();
  return ["utf8", "utf-8"].includes(raw) ? "utf-8" : raw;
}

function decodeBody(bytes, contentType) {
  const charset = charsetOf(contentType);
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

async function readCappedBody(response, maxBytes) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new FetchError(`Response is ${declared} bytes, above the ${maxBytes} byte cap`, { url: response.url });
  }
  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) throw new FetchError(`Response exceeds the ${maxBytes} byte cap`, { url: response.url });
    return buffer;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new FetchError(`Response exceeds the ${maxBytes} byte cap`, { url: response.url });
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

function retryDelayMs(attempt, response) {
  const retryAfter = Number(response?.headers?.get?.("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1_000, 30_000);
  return Math.min(2 ** attempt * 1_000, 16_000);
}

function createHttpClient({ config, allowlist, fetchImpl = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  const settings = config.sync;
  const allowed = [...new Set([...(allowlist || []), ...settings.extraAllowedHosts])].map((host) => host.toLowerCase());
  const lastRequestAt = new Map();
  // A host that keeps timing out costs one timeout per remaining candidate. After a few
  // failures in a row it is set aside for the rest of the run, and a success clears it.
  const consecutiveFailures = new Map();

  async function respectPoliteness(url) {
    const host = hostOf(url);
    if (!host || !settings.politenessDelayMs) return;
    const previous = lastRequestAt.get(host);
    if (previous) {
      const wait = settings.politenessDelayMs - (Date.now() - previous);
      if (wait > 0) await sleep(wait);
    }
    lastRequestAt.set(host, Date.now());
  }

  async function singleRequest(url, { headers = {}, method = "GET", timeoutMs = settings.requestTimeoutMs } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": settings.userAgent,
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5",
          "accept-language": "fr-FR,fr;q=0.9",
          ...headers,
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Conditional GET with allowlist enforcement on every redirect hop, a byte cap,
   * and backoff on retryable failures. Returns { notModified: true } on HTTP 304.
   */
  async function get(url, { etag = null, lastModified = null, headers = {}, timeoutMs } = {}) {
    let target = url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      if (!/^https:\/\//i.test(target)) throw new FetchError(`Refused non-HTTPS URL: ${target}`, { url: target });
      if (!isHostAllowed(target, allowed)) throw new FetchError(`Host is not in the sync allowlist: ${target}`, { url: target });

      const conditional = {
        ...(etag && hop === 0 ? { "if-none-match": etag } : {}),
        ...(lastModified && hop === 0 ? { "if-modified-since": lastModified } : {}),
        ...headers,
      };

      const host = hostOf(target);
      if ((consecutiveFailures.get(host) || 0) >= settings.hostFailureLimit) {
        throw new FetchError(`Host set aside after ${settings.hostFailureLimit} failures in a row: ${host}`, { url: target });
      }

      let response = null;
      let lastError = null;
      for (let attempt = 0; attempt <= settings.maxRetries; attempt += 1) {
        await respectPoliteness(target);
        try {
          response = await singleRequest(target, { headers: conditional, timeoutMs });
          if (!RETRYABLE_STATUS.has(response.status)) break;
          lastError = new FetchError(`HTTP ${response.status}`, { status: response.status, url: target, retryable: true });
        } catch (err) {
          response = null;
          lastError = new FetchError(err?.name === "AbortError" ? "Request timed out" : err.message, { url: target, retryable: true });
        }
        if (attempt < settings.maxRetries) await sleep(retryDelayMs(attempt, response));
      }
      if (!response) {
        consecutiveFailures.set(host, (consecutiveFailures.get(host) || 0) + 1);
        throw lastError || new FetchError("Request failed", { url: target, retryable: true });
      }
      consecutiveFailures.set(host, 0);

      if (response.status === 304) return { url: target, status: 304, notModified: true, body: null, headers: {} };
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new FetchError(`Redirect without a location header (${response.status})`, { status: response.status, url: target });
        target = new URL(location, target).toString();
        continue;
      }
      if (!response.ok) {
        throw new FetchError(`HTTP ${response.status}`, { status: response.status, url: target, retryable: RETRYABLE_STATUS.has(response.status) });
      }

      const contentType = response.headers.get("content-type") || "";
      const bytes = await readCappedBody(response, settings.maxBytes);
      return {
        url: target,
        status: response.status,
        notModified: false,
        body: decodeBody(bytes, contentType),
        byteLength: bytes.byteLength,
        headers: {
          etag: response.headers.get("etag"),
          lastModified: response.headers.get("last-modified"),
          contentType,
        },
      };
    }
    throw new FetchError(`Too many redirects starting at ${url}`, { url });
  }

  return { allowed, consecutiveFailures, get, isAllowedHost: (url) => isHostAllowed(url, allowed) };
}

module.exports = { FetchError, createHttpClient, decodeBody, isHostAllowed, readCappedBody };
