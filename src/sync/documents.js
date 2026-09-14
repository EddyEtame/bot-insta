"use strict";

const { DAYS, displayTime, isoDate } = require("../calendar");
const { planningFacts, renderPlanning } = require("../planning");
const { offerFacts } = require("./normalizers/offers");

const PRIORITY = Object.freeze({ offer: 96, planning: 92, profile: 80 });

function baseMetadata({ id, title, docType, gymIds, sourceUrl, checkedAt, capturedAt, maxAgeDays, verificationStatus, topics, facts, effectiveFrom = null, effectiveUntil = null }) {
  return {
    id,
    title,
    sourceType: "web",
    sourceUrl: sourceUrl || null,
    visibility: "public",
    verificationStatus,
    priority: PRIORITY[docType] || 60,
    language: "fr",
    effectiveFrom,
    effectiveUntil,
    docType,
    gyms: gymIds,
    generated: true,
    checkedAt,
    capturedAt,
    maxAgeDays,
    topics: [...new Set(topics.filter(Boolean))],
    facts,
  };
}

function gymTopics(gym) {
  return gym ? [gym.displayName, gym.name, gym.commune, ...gym.aliases].filter(Boolean) : ["boxing center", "toutes les salles"];
}

function buildPlanningDocument({ gym, planning, sourceUrl, checkedAt, capturedAt, maxAgeDays, verificationStatus, documentId, effectiveFrom = null, effectiveUntil = null }) {
  const content = renderPlanning(planning, { gymLabel: gym.displayName, maxDays: 7 });
  if (!content) return null;
  return {
    metadata: baseMetadata({
      id: documentId || `bc-${gym.id}-planning`,
      effectiveFrom,
      effectiveUntil,
      title: `Planning ${gym.displayName}`,
      docType: "planning",
      gymIds: [gym.id],
      sourceUrl,
      checkedAt,
      capturedAt,
      maxAgeDays,
      verificationStatus,
      topics: [...gymTopics(gym), "planning", "horaires", "cours", "creneaux", ...planning.days, ...planning.disciplines],
      facts: planningFacts(planning),
    }),
    content,
  };
}

function renderProfile(gym, profile) {
  const lines = [`${profile.name || gym.name} — salle Boxing Center${gym.commune ? ` à ${gym.commune}` : ""}.`];
  if (profile.address?.full) lines.push(`Adresse : ${profile.address.full}.`);
  if (profile.phone) lines.push(`Téléphone : ${profile.phone}.`);
  if (profile.email) lines.push(`E-mail : ${profile.email}.`);
  if (profile.hours?.length) {
    const byDay = DAYS.map((day) => {
      const entries = profile.hours.filter((entry) => entry.day === day.id);
      return entries.length
        ? `${day.fr} ${entries.map((entry) => `${displayTime(entry.open)}${entry.close ? `–${displayTime(entry.close)}` : ""}`).join(", ")}`
        : null;
    }).filter(Boolean);
    if (byDay.length) lines.push(`Horaires d’ouverture : ${byDay.join(" · ")}.`);
  }
  if (profile.disciplines?.length) lines.push(`Disciplines annoncées sur la page : ${profile.disciplines.join(", ")}.`);
  return lines.join("\n");
}

function profileFacts(gym, profile) {
  const facts = [];
  if (profile.address?.full) facts.push({ key: `address_${gym.id}`, value: profile.address.full });
  if (profile.phone) facts.push({ key: `phone_${gym.id}`, value: profile.phone });
  for (const entry of profile.hours || []) {
    facts.push({ key: `hours_${gym.id}_${entry.day}`, value: `${displayTime(entry.open)}${entry.close ? `–${displayTime(entry.close)}` : ""}` });
  }
  return facts;
}

function buildProfileDocument({ gym, profile, sourceUrl, checkedAt, capturedAt, maxAgeDays, verificationStatus, documentId, effectiveFrom = null, effectiveUntil = null }) {
  const content = renderProfile(gym, profile);
  const hasSubstance = Boolean(profile.address?.full || profile.phone || profile.hours?.length || profile.disciplines?.length);
  if (!hasSubstance) return null;
  return {
    metadata: baseMetadata({
      id: documentId || `bc-${gym.id}-profile`,
      effectiveFrom,
      effectiveUntil,
      title: `Salle ${gym.displayName} — informations pratiques`,
      docType: "profile",
      gymIds: [gym.id],
      sourceUrl,
      checkedAt,
      capturedAt,
      maxAgeDays,
      verificationStatus,
      topics: [...gymTopics(gym), "adresse", "acces", "horaires", "ouverture", "telephone", "contact", ...(profile.disciplines || [])],
      facts: profileFacts(gym, profile),
    }),
    content,
  };
}

function renderOffer(offer) {
  const parts = [`${offer.name} : ${offer.priceText}`];
  if (offer.period) parts.push(offer.period.label);
  if (offer.previousPrice) parts.push(`au lieu de ${String(offer.previousPrice).replace(".", ",")} €`);
  if (offer.commitment) parts.push(offer.commitment.label);
  return `- ${parts.join(" · ")}`;
}

function buildOffersDocument({ gym, offers, sourceUrl, checkedAt, capturedAt, maxAgeDays, verificationStatus, documentId, effectiveFrom = null, effectiveUntil = null }) {
  if (!offers.length) return null;
  const scope = gym ? gym.id : "club";
  const label = gym ? gym.displayName : "Boxing Center";
  return {
    metadata: baseMetadata({
      id: documentId || `bc-${scope}-offers`,
      effectiveFrom,
      effectiveUntil,
      title: `Offres et tarifs ${label}`,
      docType: "offer",
      gymIds: gym ? [gym.id] : [],
      sourceUrl,
      checkedAt,
      capturedAt,
      maxAgeDays,
      verificationStatus,
      topics: [...gymTopics(gym), "offre", "offres", "tarif", "tarifs", "prix", "abonnement", "inscription", ...offers.map((offer) => offer.name)],
      facts: offerFacts(offers, scope),
    }),
    content: [`Offres publiées ${gym ? `pour ${label}` : "par Boxing Center"} (relevé du ${isoDate(checkedAt)}) :`, ...offers.map(renderOffer)].join("\n"),
  };
}

module.exports = { PRIORITY, buildOffersDocument, buildPlanningDocument, buildProfileDocument, profileFacts, renderOffer, renderProfile };
