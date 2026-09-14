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

const REASONS = Object.freeze({
  NO_EVIDENCE: "No approved public knowledge matched the request",
  STALE_EVIDENCE: "The only matching knowledge is past its freshness budget",
  WRONG_GYM: "No approved knowledge for the club the customer named",
  CONFLICT: "Conflicting approved knowledge",
  NEEDS_GYM: "The answer differs per club and no club was named",
  TOPIC_NOT_COVERED: "The request is outside what the approved corpus covers",
});

function isFrench(text) {
  return /\b(je|vous|tu|prix|tarif|offre|salle|cours|bonjour|merci|parler|humain|planning|combien|horaire|horaires|quand|adresse)\b|[àâçéèêëîïôûùüÿœ]/i.test(text);
}

function gymChoiceSentence(registry, french) {
  const labels = registry ? registry.activeGyms().map((gym) => gym.label) : [];
  if (!labels.length) return null;
  const list = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} ou ${labels.at(-1)}` : labels[0];
  return french ? `Vous parlez de quelle salle : ${list} ?` : `Which club do you mean: ${list}?`;
}

function replies(french, registry) {
  const gymQuestion = gymChoiceSentence(registry, french);
  return french ? {
    clarify: "Pour vous répondre précisément : vous parlez de quelle offre, activité ou salle ?",
    clarifyGym: gymQuestion || "Vous parlez de quelle salle ?",
    escalation: "Je préfère vérifier cela avec l’équipe plutôt que de vous donner une information approximative. Je leur transmets votre demande.",
    human: "Bien sûr. Je transmets votre demande à l’équipe afin qu’une personne vous réponde.",
    refusal: "Je ne peux pas partager d’instructions internes, de données privées ou d’accès. Je peux en revanche vous aider avec une question sur Boxing Center.",
    complaint: "Je suis désolé que votre expérience vous laisse ce ressenti. Si vous me donnez le contexte, je le transmets à l’équipe.",
  } : {
    clarify: "To answer accurately, which offer, activity, or club do you mean?",
    clarifyGym: gymQuestion || "Which club do you mean?",
    escalation: "I’d rather have the team verify that than give you an approximate answer. I’m passing your request on.",
    human: "Of course. I’m passing your request to the team so someone can help you.",
    refusal: "I can’t share internal instructions, private data, or access. I can help with a Boxing Center question instead.",
    complaint: "I’m sorry this has left you feeling that way. If you share the context, I can pass it to the team.",
  };
}

function classify(text) {
  const normalized = String(text || "").trim().toLowerCase();
  // Accent-free copy: customers type "ou est la salle" as often as "où est la salle".
  const plain = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, " ");
  if (!normalized) return "empty";
  if (/(ignore (all|your|previous)|system prompt|developer message|api.?key|access token|secret|hidden knowledge|instructions? internes?|prompt système)/i.test(normalized)) return "prompt_injection";
  if (/(parler (à|avec).*humain|conseiller|responsable|someone real|speak to (a )?(human|person|agent)|representative)/i.test(normalized)) return "human_request";
  if (/(remboursement|refund|paiement.*(problème|issue)|payment.*(problem|issue)|prélèvement|chargeback|facture|invoice)/i.test(normalized)) return "payment_or_refund";
  if (/(plainte|complaint|arnaque|scam|sucks|nul|idiot|idiots|hate you)/i.test(normalized)) return "complaint_or_troll";
  if (/(https?:\/\/\S+.*){2,}|\bcrypto\b|\bcasino\b|\bseo service\b/i.test(normalized)) return "spam";
  if (/(kill yourself|menace|threat|violent|violence|harcèlement|harassment)/i.test(normalized)) return "abuse_or_sensitive";
  if (normalized.length < 5 || /^(c'est|is it|available|dispo|là|there)\??$/i.test(normalized)) return "ambiguous";
  // Naming a day in a club DM is a schedule question, whatever the verb around it.
  if (/(planning|horaire|creneau|quel jour|quels jours|cours de|seance|entrainement|schedule|timetable|a quelle heure)/i.test(plain)) return "planning_question";
  if (/\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|week ?end|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(plain)) return "planning_question";
  if (/(adresse|\bou est\b|\bou se trouve\b|\bou sont\b|\bc est ou\b|\bvous etes ou\b|acces|parking|metro|comment venir|where is|address|located|itineraire)/i.test(plain)) return "location_question";
  if (/(prix|tarif|coût|combien|price|cost|offre|abonnement|cours|horaire|salle|team building|inscription|register|membership|booking)/i.test(normalized)) return "business_question";
  return "unknown";
}

const GYM_SENSITIVE = new Set(["planning_question", "location_question", "business_question"]);

/**
 * Requests the public corpus has no reason to cover. They are answered only when the
 * retrieved evidence actually speaks about them — otherwise the quote would be invented.
 */
const SPECIAL_TOPICS = [
  { id: "privatisation", pattern: /\b(privatis\w*|louer la salle|location de la salle|anniversaire|evjf|evg)\b/, evidence: /privatis|anniversaire|location/ },
  { id: "entreprise", pattern: /\b(team building|teambuilding|comite d entreprise|cse|seminaire|sortie entreprise|pour ma boite)\b/, evidence: /entreprise|team building|seminaire/ },
  { id: "cours_particulier", pattern: /\b(cours particulier|coach particulier|coaching prive|cours prive|personal training)\b/, evidence: /particulier|prive|personal/ },
  { id: "stage", pattern: /\b(stage|stages|colonie|vacances sportives)\b/, evidence: /stage|vacances/ },
  { id: "certificat", pattern: /\b(certificat medical|licence|assurance|dispense)\b/, evidence: /certificat|licence|assurance/ },
];

function detectSpecialTopic(plainText) {
  return SPECIAL_TOPICS.find((topic) => topic.pattern.test(plainText)) || null;
}

function evidenceCoversTopic(retrieval, topic) {
  return (retrieval?.chunks || []).some((chunk) => topic.evidence.test(String(chunk.content || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

function createDecisionEngine({ registry = null } = {}) {
  return {
    decide({ text, retrieval, rateLimited = false }) {
      const languageIsFrench = isFrench(text);
      const copy = replies(languageIsFrench, registry);
      const category = classify(text);
      const base = {
        category,
        language: languageIsFrench ? "fr" : "en",
        confidence: retrieval?.confidence || 0,
        retrievedSourceIds: retrieval?.sources || [],
        gymIds: retrieval?.analysis?.gymIds || [],
      };
      if (rateLimited || category === "empty" || category === "spam") {
        return { ...base, action: ACTIONS.IGNORE, reason: rateLimited ? "Rate limit reached" : category };
      }
      if (category === "prompt_injection") return { ...base, action: ACTIONS.REFUSE, reply: copy.refusal, reason: "Prompt-injection or private-data request" };
      if (category === "human_request") return { ...base, action: ACTIONS.ESCALATE, reply: copy.human, reason: "User requested a human" };
      if (category === "payment_or_refund" || category === "abuse_or_sensitive") return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: category };
      if (category === "complaint_or_troll") return { ...base, action: ACTIONS.ESCALATE, reply: copy.complaint, reason: "Complaint requires human context" };
      if (category === "ambiguous") return { ...base, action: ACTIONS.CLARIFY, reply: copy.clarify, reason: "Message lacks a clear subject" };
      // Six clubs, six different plannings: answering without knowing which one is a coin toss.
      if (retrieval?.needsGym && GYM_SENSITIVE.has(category)) {
        return { ...base, action: ACTIONS.CLARIFY, reply: copy.clarifyGym, reason: REASONS.NEEDS_GYM };
      }
      if (!retrieval?.hasEvidence) {
        if (retrieval?.staleSources?.length) {
          return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: REASONS.STALE_EVIDENCE, staleSources: retrieval.staleSources };
        }
        if (retrieval?.wrongGymSources?.length) {
          return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: REASONS.WRONG_GYM };
        }
        return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: REASONS.NO_EVIDENCE };
      }
      if (retrieval.conflicts?.length) return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: REASONS.CONFLICT };
      // Privatisation, entreprise, cours particulier: quoting the standard price here is a wrong answer.
      const specialTopic = detectSpecialTopic(String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      if (specialTopic && !evidenceCoversTopic(retrieval, specialTopic)) {
        return { ...base, action: ACTIONS.ESCALATE, reply: copy.escalation, reason: `${REASONS.TOPIC_NOT_COVERED} (${specialTopic.id})` };
      }
      if (category === "unknown") return { ...base, action: ACTIONS.CLARIFY, reply: copy.clarify, reason: "Unclear request" };
      return { ...base, action: ACTIONS.ANSWER, reason: "Approved public knowledge retrieved" };
    },
  };
}

module.exports = { ACTIONS, REASONS, SPECIAL_TOPICS, classify, createDecisionEngine, detectSpecialTopic, gymChoiceSentence };
