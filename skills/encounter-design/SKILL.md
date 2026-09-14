---
name: encounter-design
description: The locked Runtime Studio Design Constitution made operational — how every encounter, mechanic, room, monster, or moment gets designed. Trigger whenever designing, reviewing, or implementing ANY player-facing content (encounter, mechanic, room, threat, scenario, moment, level, boss, event), whenever Eddy says "encounter", "experience", "memorable", "moment", "climax", "what will players remember", "design this", or proposes a game idea. Also trigger BEFORE coding any gameplay system - gameplay code that skips this gate is a known failure mode. Nothing player-facing gets built without passing this skill.
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

# Encounter Design

The Design Constitution is **LOCKED**. It applies to every Runtime Studio project forever. Innovation happens within these principles, not by rewriting them. Your job is to enforce it and to design at its level.

**Terminology + hierarchy (per Eddy, 2026-07-06):** the Master Bible (`notion/# Runtime Studio Master Bible.txt`) is the most recent, primary canon and says **"Experience"**; the Design Constitution says **"Encounter"** — the SAME design unit through two lenses. The two documents STACK: the Bible's idea-stage gates (the Whiteboard: inspiration/emotion/hook/memorable moment/one-sentence experience/replayability/multiplayer?/deserves-to-exist + the Five Questions + the Runtime Test "would I open this door, enjoy it, remember it, tell someone, is it transformed not copied, why does it deserve to exist") run FIRST; the Constitution's design-stage law (climax-first process, five acts, evaluation gate below) runs SECOND. The Bible's Runtime Triangle — FUN / MEMORIES / CURIOSITY, remove one and the experience weakens — and its pyramid (Mechanics at the bottom, Memory at the top, never reversed) govern both stages.

## The unit of design

**The encounter** — a complete dramatic experience where the player discovers something new, makes meaningful choices, and exits with permanently changed understanding of the world. Not a level (a place), not a monster (a tool), not a puzzle (one solution). Eddy, verbatim: **"A monster does not simply exist inside a room. The room is an extension of the monster itself."** An encounter = environment + threat + atmosphere + sound + player choice + consequence, fused.

Success is measured by one thing: players immediately telling someone. "BRO, YOU HAVE TO TRY THIS." If the moment can't be described in one excited sentence, it isn't done.

## The Five Pillars — know these five words

1. **CURIOSITY** — players continue because they need to know what's next, not because of XP, arrows, or rewards. Discovery precedes understanding: show through sound, environment, consequence, absence, contradiction. Never explain. No tutorials. The design itself teaches. Eddy: "Curiosity should come before understanding. Players open the next door because curiosity overcomes fear."
2. **DRAMA** — every encounter is a story with the five-act structure (below). One dramatic arc per encounter. The climax is undeniable: simple, emotional, sensory, consequential, repeatable.
3. **CHOICE** — 2-3 genuinely valid approaches (fight / evade / solve differently / use the environment), each viable but risky. Every encounter asks ONE core question ("Should I move?" "Should I trust this?" "Should I look?") and **no two encounters ask the same question**. Exit thinking "what if I had...?" — that curiosity is the replay engine.
4. **TRUST** — sacred and inviolable. Once players learn a rule, the world never lies about it. All survival information exists somewhere in the encounter (hidden, subtle, in sound, in absence, in contradiction — but it EXISTS). Losing because information wasn't available = bad design. Losing because you didn't notice available information = good design.
5. **MEMORY** — every encounter permanently changes world understanding ("Silence is more dangerous than noise", "My instincts are inverted here"). It teaches exactly ONE new thing. Players remember moments, not mechanics — design for the sentence "There was this moment when I realized..."

## The Five-Act Structure

**Act I: Arrival** (enter unknown space, gather info) → **Act II: Discovery** (realize the TRUE threat) → **Act III: Escalation** (threat becomes active, pressure) → **Act IV: Climax** (the one unforgettable moment) → **Act V: Resolution** (quick, clears the space for what's next).

Each act lasts progressively less time. Acts I-III are setup; Act IV is the heartbeat; Act V never overstays. **Brevity is power** — conclude shortly after the climax.

## The Climax Rule — design order is mandatory

**If you cannot describe the unforgettable moment in one sentence, you are not ready to design the encounter.**

1. Define the climax moment (one sentence, visceral, describable).
2. Define the world-changing lesson (one sentence, exactly one new thing).
3. Design the discovery (sound? observation? consequence? contradiction? absence?).
4. Build the five acts around the climax.
5. Create 2-3 choice points, each viable but risky.
6. Test for consistency (no invisible tricks; all info available; clever-but-slow player can win; multiple solutions).
7. **Cut everything that doesn't serve the climax.**

## Threat ambiguity

The danger is not always a creature. It might be: the environment (structure, toxin, time, temperature) / a mechanism / absence (something that should be here isn't) / the player's own assumption / a schedule / the exit itself / another entity. Misdirection is valid — but the reveal must feel inevitable in hindsight, never arbitrary.

## Mechanical accessibility & failure

No encounter requires mechanical mastery. Survival = observation + adaptation + decision-making + strategy — never reflexes, frame-perfect timing, memorized sequences. **A clever player with poor reflexes always has a path to victory.** Failure teaches (reveals rules), happens FAST (no doomed-scenario slow deaths), never feels unfair, and makes the player immediately want to retry. Failure is a teaching method, not punishment.

## Project 001 specifics (current canon)

- **Setting: The Threshold** — an impossible, indifferent place. Architecture feels wrong; rooms shouldn't connect; the world doesn't exist for the player, the player merely happens to be inside it. Eddy chose "The Threshold over The Examination — the world should feel indifferent rather than intentionally testing the player."
- **Core fantasy:** not a superhero, not chosen — someone trying to survive a place that doesn't care. Curiosity keeps them moving; observation keeps them alive; choice defines their experience.
- **Emotional loop per session:** Curiosity → Uncertainty → Discovery → Pressure → Decision → Consequence → Relief → Curiosity again. The constant question: "What's behind the next door?"
- **The four prototype encounter archetypes:**
  1. **The Silent Witness** — paranoia / violation (being watched, recorded, studied).
  2. **The Violent Rhythm** — panic → understanding → control.
  3. **The Hidden Presence** — doubt → dread → revelation.
  4. **The Moral Collapse** — guilt → helplessness → moral weight.
  All four must feel COMPLETELY different — different question, different emotion, different lesson.
- **Progression = wisdom, not power.** Better observation, better judgment, better understanding. Knowledge is the progression system.
- Understanding should not always reduce fear: "Sometimes learning the truth should make an encounter even more terrifying."

## Inspiration → transformation (from the Master Bible, still law)

Inspiration can come from anywhere — anime, movies, music, dreams, myths, memes, history, a conversation. But **we extract, never copy**: Inspiration → what emotion? → why memorable? → what question does it ask? → transform into something original. References are seasoning, never the meal. A player should say "this reminds me of..." never "this copied...". Remove every visual reference in your head — is it still fun? Then the foundation is strong.

## The evaluation gate — run before approving ANY encounter

Structure: five acts? climax clear + one sentence? one core question? — Design: teaches exactly one thing? discovery organic (not explained)? all needed info available? multiple valid solutions? "what if?" moments? — Experience: want to replay the moment? will they tell others? permanent understanding shift? does failure teach? — Execution: climax fast? consistent (no invisible tricks)? no mechanical mastery required? respects player time?

One "no" = revise. All eight properties present (emotionally complete, unforgettable moment, world-changing, fair/learnable, emergent, memorable, theory-generating, fast) = ready to build.

## Anti-patterns (named defects)

Encounters relying on: big explosions, long dialogue, randomness, cheap jump scares, surface-level references, artificial difficulty, complicated mechanics, repetition, "wouldn't it be cool if..." reasoning, features without an experience behind them, two encounters asking the same question, staying in one emotional state, a beautiful room where nothing memorable happens. Eddy: "Avoid becoming overly abstract or philosophical. Every design principle must eventually translate into memorable gameplay."
