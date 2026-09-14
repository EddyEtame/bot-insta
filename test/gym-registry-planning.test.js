"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { detectDays, displayTime, nextWeeklyRun, parseTime, parseTimeRange } = require("../src/calendar");
const { loadGymRegistry, parseRegistry, titleCase } = require("../src/gyms");
const { detectAudiences, detectDisciplines, disciplineFamily, filterSessions, normalizePlanning, planningFacts, renderPlanning } = require("../src/planning");
const { createWorkspace } = require("./fixtures/workspace");

function registry() {
  const workspace = createWorkspace();
  try {
    return loadGymRegistry(workspace.config);
  } finally {
    workspace.cleanup();
  }
}

test("the registry carries the six clubs with their official spelling and no errors", () => {
  const gyms = registry();
  assert.deepEqual(gyms.errors, []);
  assert.deepEqual(gyms.gyms.map((gym) => gym.displayName), ["BALMA", "SAINT-CYPRIEN", "ÉTATS-UNIS", "MINIMES", "RAMONVILLE", "PORTET"]);
  assert.deepEqual(gyms.gyms.map((gym) => gym.label), ["Balma", "Saint-Cyprien", "États-Unis", "Minimes", "Ramonville", "Portet"]);
  assert.equal(titleCase("SAINT-CYPRIEN"), "Saint-Cyprien");
});

test("a club is recognised from how customers actually write it, and never from a word that merely contains it", () => {
  const gyms = registry();
  assert.deepEqual(gyms.detect("le planning de st cyp svp"), ["saint-cyprien"]);
  assert.deepEqual(gyms.detect("vous êtes où à Portet-sur-Garonne ?"), ["portet"]);
  assert.deepEqual(gyms.detect("cours le mardi aux Minimes et à Balma"), ["balma", "minimes"]);
  assert.deepEqual(gyms.detect("balmasol est une marque"), []);
  assert.equal(gyms.mentionsAllGyms("je peux aller dans toutes les salles ?"), true);
});

test("a registry that disagrees with itself reports the problem instead of loading silently", () => {
  const broken = parseRegistry({
    club: { gymCount: 3 },
    gyms: [{ id: "balma", displayName: "BALMA", sources: [{ id: "x", docType: "unknown", kind: "ftp" }] }, { id: "balma", displayName: "BALMA" }],
  }, "memory");
  assert.ok(broken.errors.some((message) => message.includes("duplicate gym ids")));
  assert.ok(broken.errors.some((message) => message.includes("gymCount")));
  assert.ok(broken.errors.some((message) => message.includes("unknown docType")));
  assert.ok(broken.errors.some((message) => message.includes("unknown source kind")));
});

test("times are read the way a planning writes them, and never from a price or an age range", () => {
  assert.equal(parseTime("18h30"), "18:30");
  assert.equal(parseTime("9h"), "09:00");
  assert.equal(parseTime("19:00"), "19:00");
  assert.equal(parseTime("29.99 €"), null);
  assert.equal(parseTime("7-12 ans"), null);
  assert.deepEqual(parseTimeRange("de 9h à 10h30"), { start: "09:00", end: "10:30" });
  assert.equal(displayTime("10:00"), "10h");
  assert.equal(displayTime("18:30"), "18h30");
  assert.deepEqual(detectDays("vous ouvrez le mardi et le week-end ?"), ["dimanche", "mardi", "samedi"]);
});

test("the Sunday slot lands on Sunday in Paris on both sides of the daylight-saving change", () => {
  const winter = nextWeeklyRun(new Date("2026-02-04T12:00:00Z"), { weekday: 0, hour: 4, minute: 30, timeZone: "Europe/Paris" });
  const summer = nextWeeklyRun(new Date("2026-07-01T12:00:00Z"), { weekday: 0, hour: 4, minute: 30, timeZone: "Europe/Paris" });
  assert.equal(winter.toISOString(), "2026-02-08T03:30:00.000Z");
  assert.equal(summer.toISOString(), "2026-07-05T02:30:00.000Z");
  const justAfter = nextWeeklyRun(new Date("2026-07-05T03:00:00Z"), { weekday: 0, hour: 4, minute: 30, timeZone: "Europe/Paris" });
  assert.equal(justAfter.toISOString(), "2026-07-12T02:30:00.000Z");
});

test("a discipline is classified by its most specific name, and an ambiguous label stays unclassified", () => {
  assert.equal(disciplineFamily("Boxing fitness"), "boxing-fitness");
  assert.equal(disciplineFamily("Boxe éducative 7-12 ans"), "boxe-educative");
  assert.equal(disciplineFamily("Muay Thai / K1"), "boxe-thai");
  assert.equal(disciplineFamily("Boxe"), null);
  assert.deepEqual(detectDisciplines("cours de MMA et grappling"), ["mma", "grappling"]);
  assert.deepEqual(detectDisciplines("vous faites de la boxe ?"), []);
  assert.deepEqual(detectAudiences("des cours pour enfants ?"), ["enfants"]);
});

test("a planning is deduplicated, ordered, rendered per day and turned into one fact per day", () => {
  const planning = normalizePlanning({
    gymId: "balma",
    sessions: [
      { day: "Mardi", start: "18h30", end: "20h00", discipline: "Boxe anglaise", level: "tous niveaux" },
      { day: "mardi", start: "12h15", discipline: "Boxing fitness" },
      { day: "mardi", start: "18h30", end: "20h00", discipline: "Boxe anglaise", level: "tous niveaux" },
      { day: "samedi", start: "10h", end: "11h30", discipline: "Boxe éducative", audience: "7-12 ans" },
      { day: "nawak", start: "10h", discipline: "Rien" },
    ],
    notes: ["Planning aménagé fin juillet–mi-août"],
  });
  assert.equal(planning.sessions.length, 3);
  assert.deepEqual(planning.sessions.map((session) => session.start), ["12:15", "18:30", "10:00"]);
  const rendered = renderPlanning(planning, { gymLabel: "Balma" });
  assert.match(rendered, /MARDI : 12h15 Boxing fitness \| 18h30–20h Boxe anglaise · tous niveaux/);
  assert.match(rendered, /Planning aménagé fin juillet–mi-août/);
  assert.equal(renderPlanning(planning, { gymLabel: "Balma", days: ["samedi"] }).includes("MARDI"), false);
  assert.deepEqual(planningFacts(planning).map((fact) => fact.key), ["planning_balma_mardi", "planning_balma_samedi"]);
  assert.equal(filterSessions(planning.sessions, { disciplines: ["mma"] }).length, 0);
  assert.equal(filterSessions(planning.sessions, { audiences: ["enfants"] }).length, 1);
});
