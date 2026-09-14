---
name: ship-real
description: La definition de « fini » : rien n'est fait parce que ca compile. CHARGER quand une tache approche de sa fin, AVANT toute affirmation du type « c'est fait », « c'est bon », « termine », « c'est en ligne », « deploye », « ca marche », et sur ses questions « ca marche vraiment ? », « t'as verifie ? », « on en est ou ? ». Se declenche aussi sur « on met en ligne », « on pousse », « deploie », « en prod », « livre », sur toute echeance donnee, et sur toute demande d'etat d'avancement. Aussi en anglais : ship, push, release, done, finished, production ready.
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

# Ship Real

Shipping is where thinking, research, and critique either become real or turn out to have been theater. The permanent counter-example: Horror Castle's RoundService — mock loops that LOOKED like a system and shipped 0% of one. Never again. A stub is labeled a stub; "done" means the Definition of Done, entire.

## The sprint paradox

**"We're in a rush, but we're not in a rush... We're doing high-quality work so that we don't have to get back to it again."** Urgency never authorizes shortcuts. A thing finished right is finished forever; a thing finished fast is a future task with interest. Quality over speed is Handbook law: "A small finished game is better than a large unfinished one." Finish before expanding — never five unfinished systems; complete one, learn, then next.

## Universal Definition of Done (compiled from all 10 department briefs)

A task is complete when ALL hold:
1. Works as intended per the APPROVED design (not a private improvement of it).
2. Tested in actual gameplay — never judged in isolation, never "worked once."
3. Zero console errors.
4. Performance considered and checked (memory, part/particle counts, network, low-end mobile).
5. Security considered (server validates every input this feature adds).
6. Multiplayer behavior correct (or explicitly N/A for the prototype, with the boundary architected).
7. Organized and named per standards; no dead code, no placeholders left behind.
8. Documentation updated (or explicitly not needed).
9. Related departments' dependencies delivered or flagged.
10. Reported back to Studio HQ with an honest %.

## QA release criteria (before recommending ANY release)

All critical bugs resolved • no gameplay blockers • stable under realistic conditions (desktop + mobile; multiplayer if applicable) • acceptable performance on low-end hardware • UI clear at all resolutions • audio functioning and balanced • animations functioning • saving verified • documentation updated • no known release-blocking issues. If any critical issue remains, **recommend delaying release** — QA represents the player, not the schedule. Testing philosophy: "Never test only the expected behavior. Ask: what happens if the player does something unexpected?" Think like a curious player trying to break the game. Every bug report: title, description, expected vs actual, repro steps, severity, frequency, platform, evidence, owning department.

## Prototype success criteria (Project 001 — the current finish line)

The prototype is complete when a player can start the game, experience every encounter (all four archetypes), reach the ending, and **want to immediately replay**. **Mobile sanity checks are IN scope** (Eddy, 2026-07-06): no heavy mobile optimization yet, but every build must run, read, and control acceptably on one low-end phone — ~70% of Roblox is mobile, and a prototype that dies on the primary device validates nothing. Validation targets: players want to continue exploring • remember individual encounters • form theories about the world • experiment with different approaches • feel tension without frustration. The canon exit line is **"I need to know what's behind the next door"** — not "I leveled up," not "the combat was cool," not "the graphics looked nice" (Project Bible). Measure by watching playtests: smiles, hesitations, screams, replays, stories told afterward. Their behavior outranks our opinions.

## The final-pass stack (run in order, every ship)

1. **Functionality** — every interaction, route, edge case.
2. **Baffled-bar pass** — full persona rotation (see baffled-bar). Feedback then fix.
3. **Fresh-clone test** — clone the repo clean, `rojo build` / serve, open in Studio, play. If a teammate can't go from clone to playing with the README alone, it's not done.
4. **Cross-device** — desktop + mobile touch + low-end performance.
5. **Security sweep** — attack your own remotes (exploiter persona).
6. **Regression** — what worked before still works: "A fix should never create two new bugs."
7. **Docs + changelog + honest % report.**
8. **Push** — correct repo, correct branch, clean history, NO credentials or junk files (and never re-print credentials Eddy pasted in chat into any file or output), then report: remote, branch, how a collaborator gets it running. Integrity rider: never misattribute authorship — the work is Runtime Studio's, signed honestly.

## Status report format

What shipped (cited) • honest % and the exact gaps to 100 • known debt (every stub named) • risks • next actions. Never say "done" when you mean "compiles." Never demo a mock as a milestone. The report is the deliverable that buys the next task.

## Release phases (Handbook)

Final QA pass → release notes → backup created → deploy to Roblox → monitor → collect feedback → reflect (what surprised us, what did players remember, what becomes studio law). Shipping is the beginning: the experience belongs to the community now, and reflection feeds the next cycle.
