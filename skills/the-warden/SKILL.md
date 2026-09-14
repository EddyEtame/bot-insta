---
name: the-warden
description: Le registre des fautes : ce qu'Eddy signale une fois ne doit jamais revenir. CHARGER des qu'une erreur, un bug, un test rate ou une sortie fausse apparait, des qu'il attrape le moindre defaut, avant toute affirmation d'achevement ou toute mise en ligne, et sur « encore ? », « je t'ai deja dit », « c'est la deuxieme fois », « tu recommences », « retiens ca », « note ca », « ajoute ca aux regles », « apprends de tes erreurs ». Volontairement minuscule pour pouvoir se charger toujours et ne presque rien couter.
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

# The Warden

One job: **the same mistake never costs Eddy twice.** Memory lives in two flat files — reading them costs a few hundred tokens, appending rides on turns that already happen. No separate sessions, no extra agents, no scheduled runs. That is the whole cost model.

## The two files

- `<projet>/.registre/REGLES.md` — the distilled laws. Read at EVERY session start (it's short by design; hard cap 25 rules).
- `<projet>/.registre/FAUTES.md` — append-only history. One line per mistake: `date | where | what went wrong | root cause | the rule now`. Newest last. Skim the tail (last ~10 lines) at session start.

## The loop (all in the SAME turn — never a separate exchange)

1. **Catch** — an error fires, a test fails, or Eddy flags a flaw.
2. **Fix + sweep** — fix it AND its siblings project-wide (Rule 10).
3. **Append** — ONE line to MISTAKES.md. Root cause, not symptom. No essays.
4. **Promote** — if the mistake repeats, or Eddy caught it himself, distill it into a one-line rule in RULES.md. Merge with an existing rule if one is close; never duplicate.
5. **Prune** — if RULES.md nears 25, merge overlapping rules. The file staying short IS the feature: a bloated ledger silently stops being read.

## The gate (before ANY "done", ship, or push)

Diff the work against RULES.md, rule by rule — it takes seconds because the file is short. Any rule violated = not done, whatever it looks like. Then the baffled-bar pass runs as usual; the Warden is the floor, baffled-bar is the ceiling.

## Cost discipline (Eddy's explicit order)

"These are things that shouldn't consume credits... reduced to the basic basics." Therefore: one-line entries only • append in the turn where the mistake surfaced • never spawn a session or agent just to log • never rewrite the ledger wholesale • never paste the ledger back to Eddy unless he asks — report only NEW rules created, in one line ("New rule #11: ...").

## Different hands, one memory

Multiple people and models will touch this code. The ledger is model-agnostic and human-readable: any Claude, any teammate, any future model reads the same two files and inherits every scar. When a new collaborator starts, RULES.md is their first read after the canon.
