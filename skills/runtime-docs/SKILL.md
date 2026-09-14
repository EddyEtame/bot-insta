---
name: runtime-docs
description: Runtime Studio's documentation law — one source of truth, decisions logged and dated, why over what, archive everything. Trigger when writing/updating ANY document (spec, design doc, README, changelog, decision, standard, onboarding guide), when a decision is made anywhere (it must be logged), when docs contradict each other, or when Eddy mentions documentation, docs, Notion, decision log, changelog, spec, bible, or "write this down". Documentation is the studio's memory and its synchronization mechanism - treat every doc as load-bearing.
---

<!-- baffled-bar:source-of-truth -->
> **Source de verite : `baffled-bar`.** A charger AVANT de produire quoi que ce soit de
> visible et AVANT d'annoncer que c'est fini. Son standard prime sur tout ce qui suit :
> en cas de desaccord entre cette skill et `baffled-bar`, c'est `baffled-bar` qui gagne.
>
> **Source of truth: `baffled-bar`.** Load it before producing anything visible and before
> claiming anything is done. Its standard overrides everything below; where this skill and
> `baffled-bar` disagree, `baffled-bar` wins. The bar only moves up: a claimed 100% is 20%,
> 15% with rigor. Seeing no flaw means the review failed.

# Runtime Docs

Documentation is not paperwork. It is **memory** — and in a multi-chat studio it is also the **synchronization mechanism** (the docs are the meeting). "A project can survive losing code backups more easily than it can survive losing the knowledge of why that code exists."

## The one job

Every document answers: **"What does someone need to understand to continue this work without us?"** Someone joining in six months must become productive from documentation alone — no questions needed. If it isn't written down, assume it will be forgotten. Never rely on memory: not yours, not Claude's, not Eddy's.

## One source of truth

Every topic has exactly ONE authoritative document. Never allow conflicting versions of the same truth. The hierarchy (higher wins):

1. **Runtime Studio Constitution** — studio governance. LOCKED; changes are rare, studio-wide, documented.
2. **Design Constitution (Encounter Design Principles)** — permanent design law, all projects. LOCKED.
3. **Studio Handbook** — how we operate. Living; improved deliberately.
4. **Project Bible (Project 001)** — this game's vision. Below Constitution: on conflict, Constitution wins.
5. **Dashboard / Task Registry / decision log** — current state.
6. Chat messages — temporary until documented.

Claude never invents studio philosophy; every session begins from the newest approved documentation (see runtime-studio-core ritual).

## Why over what

Poor: "There is a timer." Great: "The timer exists to create urgency and force quick decisions." **The why survives longer than the implementation.** Every document explains: What is this? Why does it exist? How does it work? Who owns it? What depends on it? How is it maintained?

## The decision log — non-negotiable discipline

Every meaningful decision, logged the day it's made, dated, append-only, using the Handbook template: Decision (one sentence) / Context / Options considered with pros-cons / Reasoning / Impact / Reversibility / Approvals. The Horror Castle archive did this well (`discord/docs/decisions.md` — dated, justified, locked entries) and it's the reason that project's history is still legible. Two laws stack on top:
1. **A logged decision binds until explicitly revoked** — re-litigating costs credits and trust.
2. **A logged decision must propagate** — the day a decision locks, sweep code + docs for violations (the Direction G failure is the permanent counter-example: locked on paper, violated in the only screen ever built).

## Document types (Master Bible taxonomy, still law)

Master documents (permanent philosophy, rarely change) • Project documents (one project's vision, roadmap) • Experience/Encounter documents (one encounter, beginning to end) • Technical documents (architecture, systems, APIs, data flow) • Research documents (watches, teardowns, references, application plans) • Archive documents (past versions, cancelled concepts — "nothing valuable is truly lost").

## Writing standards

Concise, structured, accurate, easy to scan, jargon-free, consistent formatting. Headings, bullets, tables, diagrams where they improve understanding. Assume the reader knows nothing: no hidden assumptions, no inside jokes, no unexplained abbreviations. Complex ideas should FEEL simple after reading — if an idea needs five pages, question the idea. Documentation should become easier to understand over time, not longer.

## Versioning & the archive

Major revisions get versions (V1.0 → V2.0); past versions archived, never destroyed — history explains growth. Old ideas are fuel: the Future Ideas Archive and the Horror Castle folder exist because future projects rediscover forgotten gold. Outdated info is revised or archived promptly — a stale doc is worse than no doc because it lies with authority.

## Workflow & Definition of Done (Documentation dept)

Gather → understand the system → organize → write clearly → review for accuracy → publish → update when things change → archive superseded versions. Done when: accurate • organized and readable • diagrams/examples where helpful • related docs updated • reflects the CURRENT project state • reported to Studio HQ.

## The test

Before approving any document: **"Can someone understand this without asking me questions?"** If no — keep improving. Good documentation answers questions before they are asked; every document should make the next idea easier to create.
