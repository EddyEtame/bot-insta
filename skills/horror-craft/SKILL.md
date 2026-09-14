---
name: horror-craft
description: How Runtime Studio builds fear — atmosphere, dread, sound-as-information, and The Threshold's world rules. Trigger when designing or implementing anything horror-adjacent - threats, monsters, encounters, rooms, ambience, audio, lighting, tension, scares, paranoia, or when Eddy mentions fear, dread, atmosphere, The Threshold, horror, creepy, tension, or scary. Works WITH encounter-design (structure) - this skill supplies the fear itself.
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

# Horror Craft

## The law of fear (Project Bible pillar, verbatim)

**"Fear comes from uncertainty. Not jump scares. Not loud noises. Not cheap tricks."** A jump scare is a refund on dread — it spends in one second what uncertainty builds over minutes. Runtime Studio's fear is the kind that makes a player hover at a door, genuinely unsure, and open it anyway because curiosity beats terror. That exact tension — curiosity overcoming fear — IS the game.

## The Threshold — world rules

- The place is **impossible**: architecture feels wrong, rooms shouldn't connect, geometry quietly disagrees with itself. Wrongness is felt before it's noticed.
- The place is **indifferent**: it does not test, hunt, or perform for the player. "The world doesn't exist for the player. The player simply happens to be inside it." Indifference is scarier than malice — malice means you matter.
- Every room has its own identity and asks a different question.
- The environment communicates before any UI or dialogue: light, absence, sound, arrangement. Players should feel something before anything speaks.

## Dread techniques (ranked tools, all trust-safe)

1. **Uncertainty** — the player lacks one crucial piece of information and knows it.
2. **Absence** — something that should be here isn't (sound that stops, an NPC missing, a door that was open).
3. **Contradiction** — two signals disagree (safe-looking room, wrong shadow direction; cheerful audio, hostile layout).
4. **Awareness** — evidence the place noticed you (a change behind your back, your own path altered).
5. **Schedule** — something happens on a timer the player senses but hasn't decoded.
6. **Inversion** — a learned instinct becomes wrong in one specific, learnable context ("silence is more dangerous than noise").
7. **Paranoia** — plant doubt about which signals are real (see the archive harvest below).
Never: darkness so total it's unreadable, random unavoidable deaths, fake-out rule breaks. **Trust is inviolable** — once a rule is learned, the world never lies about it. Fear lives inside fairness or it dies on replay.

## Sound is information (Audio Department law)

"A player should often understand what is happening before they even see it." Every sound answers at least one question: What happened? Where? Is it dangerous? Did my action succeed? How should I feel? Never add sound to fill silence — **silence is just as important as sound**, and in horror it is the loudest tool: cut ambience seconds BEFORE a reveal and the player's own alertness does the work. Players must learn to trust their ears — which is exactly what makes engineered false audio devastating (below). Directional/positional cues must be honest in geometry even when the source lies about its nature.

## The paranoia arsenal — harvested from the Horror Castle archive

Horror Castle is an ARCHIVED concept (see runtime-studio-core), but its craft was real. These mechanisms live in `RuntimeStudio/discord/docs/` and may be transformed (never copied wholesale) into Threshold encounters:

- **Fake signals** (Echo Hall): real objectives mixed with counterfeit ones (3 real sigils, 2 fake). The fake is detectable by observation — a tell in behavior, placement, or detail — so paranoia is learnable, therefore fair.
- **Fake NPCs**: entities that imitate the friendly/expected, betrayed by a pathing tell (too smooth, wrong idle, never blinks at the right time). The tell must be consistent.
- **Fake audio events**: footsteps with no walker, whispers from empty corners — engineered to attack the "trust your ears" habit, ALWAYS distinguishable by a learnable property (timbre, reverb, direction offset).
- **Isolation targeting** (The Choir): the threat prefers the isolated — a server-side isolation score. Translated single-player: the threat prefers the player who lingers alone in darkness / away from anchors, making positioning itself an emotional choice.
- **Hunt phase FSM** (spec literal: Dormant → Stalking → Pre-Hunt → Hunting → Catching → Dissipating, with Stalking reserved for V1.2): dread lives in Pre-Hunt — the signaled-but-not-started phase. Give every threat a telegraphed pre-state the player learns to read.
- **Direction G's discipline** (archive, not law): its power was restraint — near-monochrome + one violent accent color, zero ornament. The general lesson stands: fear reads best on a quiet canvas; one accent (a color, a sound, a motion) hits hardest when everything else whispers. Project 001's visual direction is decided by Eddy, not inherited.

## Discovery choreography (fear edition)

Per encounter-design, discovery precedes understanding. In horror, choreograph it: (1) evidence before entity — consequences of the threat before the threat; (2) partial glimpses before full sight — silhouette, reflection, sound-shadow; (3) full sight only at maximum dramatic cost (Act III/IV); (4) understanding arrives WITH the climax or after — and sometimes understanding makes it worse: "learning the truth should make an encounter even more terrifying" (Eddy).

## Craft floor (the baffled bar applies to fear)

Atmosphere is built from the same surfaces Eddy named — colors, shading, gradients, light falloff, fog density, sound mix. A lazy gradient breaks dread as surely as a bug. Lighting is design, not decoration: darkness must still read (silhouettes, rim light, practical sources). Mobile reality: fear must survive a small bright screen in a lit room — contrast and audio mixing tested on a phone speaker, not studio headphones. Every scare rehearsed against the persona rotation: the DOORS veteran must not predict it; the 9-year-old must survive understanding it; the streamer must want to clip it.
