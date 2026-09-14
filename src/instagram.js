"use strict";

function sendUrl(config) {
  const base = config.instagramApiMode === "instagram_login"
    ? "https://graph.instagram.com"
    : "https://graph.facebook.com";
  const target = config.instagramApiMode === "instagram_login" ? "me" : config.instagramAccountId;
  return `${base}/${config.metaApiVersion}/${target}/messages`;
}

async function sendInstagramText(config, recipientId, text, fetchImpl = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetchImpl(sendUrl(config), {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.instagramAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Instagram Send API returned ${response.status}${body?.error?.message ? `: ${body.error.message}` : ""}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { sendInstagramText, sendUrl };
