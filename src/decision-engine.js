"use strict";

const ACTIONS = Object.freeze({
  ANSWER: "ANSWER",
  CLARIFY: "CLARIFY",
  REDIRECT: "REDIRECT",
  ESCALATE: "ESCALATE",
  IGNORE: "IGNORE",
  NO_RESPONSE: "NO_RESPONSE",
  REFUSE: "REFUSE",
});

function isFrench(text) {
  return /\b(je|vous|tu|prix|tarif|offre|salle|cours|bonjour|merci|parler|humain|planning|combien)\b|[àâçéèêëîïôûùüÿœ]/i.test(text);
}

function replies(french) {
  return french ? {
    clarify: "Pour vous répondre précisément : vous parlez de quelle offre, activité ou salle ?",
    escalation: "Je préfère vérifier cela avec l’équipe plutôt que de vous donner une information approximative. Je leur transmets votre demande.",
    human: "Bien sûr. Je transmets votre demande à l’équipe afin qu’une personne vous réponde.",
    refusal: "Je ne peux pas partager d’instructions internes, de données privées ou d’accès. Je peux en revanche vous aider avec une question sur Boxing Center.",
    complaint: "Je suis désolé que votre expérience vous laisse ce ressenti. Si vous me donnez le contexte, je le transmets à l’équipe.",
  } : {
    clarify: "To answer accurately, which offer, activity, or club do you mean?",
    escalation: "I’d rather have the team verify that than give you an approximate answer. I’m passing your request on.",
    human: "Of course. I’m passing your request to the team so someone can help you.",
    refusal: "I can’t share internal instructions, private data, or access. I can help with a Boxing Center question instead.",
    complaint: "I’m sorry this has left you feeling that way. If you share the context, I can pass it to the team.",
  };
}

function classify(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return "empty";
  if (/(ignore (all|your|previous)|system prompt|developer message|api.?key|access token|secret|hidden knowledge|instructions? internes?|prompt système)/i.test(normalized)) return "prompt_injection";
  if (/(parler (à|avec).*humain|conseiller|responsable|someone real|speak to (a )?(human|person|agent)|representative)/i.test(normalized)) return "human_request";
  if (/(remboursement|refund|paiement.*(problème|issue)|payment.*(problem|issue)|prélèvement|chargeback|facture|invoice)/i.test(normalized)) return "payment_or_refund";
  if (/(plainte|complaint|arnaque|scam|sucks|nul|idiot|idiots|hate you)/i.test(normalized)) return "complaint_or_troll";
  if (/(https?:\/\/\S+.*){2,}|\bcrypto\b|\bcasino\b|\bseo service\b/i.test(normalized)) return "spam";
  if (/(kill yourself|menace|threat|violent|violence|harcèlement|harassment)/i.test(normalized)) return "abuse_or_sensitive";
  if (normalized.length < 5 || /^(c'est|is it|available|dispo|là|there)\??$/i.test(normalized)) return "ambiguous";
  if (/(prix|tarif|coût|combien|price|cost|offre|abonnement|cours|horaire|planning|salle|adresse|team building|inscription|register|membership|booking)/i.test(normalized)) return "business_question";
  return "unknown";
}

function createDecisionEngine() {
  return {
    decide({ text, retrieval, rateLimited = false }) {
      const languageIsFrench = isFrench(text);
      const copy = replies(languageIsFrench);
      const category = classify(text);
      const base = { category, language: languageIsFrench ? "fr" : "en", confidence: retrieval?.confidence || 0, retrievedSourceIds: retrieval?.sources || [] };
      if (rateLimited || category === "empty" || category === "spam") return { ...base, action: ACTIONS.IGNORE, reason: rateLimited ? "Rate limit reached" : category };
      if (category === "prompt_injection") return { ...base, action: ACTIONS.REFUSE, reply: copy.refusal, reason: "Prompt-injection or private-data request" };
      if (category === "human_request") return { ...base, action: ACTIONS.ESCALATE, reply: copy.human, reason: "User requested a human" };
      if (category === "payment_or_refund" || category === "abuse_or_sensitive") return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: category };
      if (category === "complaint_or_troll") return { ...base, action: ACTIONS.ESCALATE, reply: copy.complaint, reason: "Complaint requires human context" };
      if (category === "ambiguous") return { ...base, action: ACTIONS.CLARIFY, reply: copy.clarify, reason: "Message lacks a clear subject" };
      if (!retrieval?.hasEvidence) return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: "No approved public knowledge matched the request" };
      if (retrieval.conflicts?.length) return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: "Conflicting approved knowledge" };
      if (category === "unknown") return { ...base, action: ACTIONS.CLARIFY, reply: copy.clarify, reason: "Unclear request" };
      return { ...base, action: ACTIONS.ANSWER, reason: "Approved public knowledge retrieved" };
    },
  };
}

module.exports = { ACTIONS, classify, createDecisionEngine };
