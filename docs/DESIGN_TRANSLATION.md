# Boxing Center design → Instagram support behavior

The bot does not need a decorative dashboard to feel like Boxing Center. The DM itself is the interface. These are the concrete, deliberately selected translations—not a mood-board dump.

| Evidence | Reused principle | Agent implementation |
| --- | --- | --- |
| `BOXING CENTER 2026/00_MASTER/Master_OFFRE_DUO_29€.png` | Offer hierarchy: brand → offer → tactile price → proof → locations. | A supported DM answer leads with the relevant offer/fact, then up to three verified proofs, then one next step. It never buries price under greeting text. |
| Live `/offre/29` funnel | 29,99 € / 4 weeks, no commitment, five-room access, card-first payment; referral data is a sensitive trust moment. | The offer is a source-traced public knowledge document. Payment, contract, eligibility, consent, and privacy questions deterministically escalate. |
| Portet site theme and motion system | Deep field, disciplined contrast, compressed all-caps hierarchy, mono micro-labels, one primary action. | Message rhythm is high-signal: short scan-friendly lines, one action only, no decorative emoji storm or generic “AI assistant” language. |
| `STUDIO_OS_BoxingCenter.md` hater rubric | “GARDE / REFAIT”, exact offer wording, no fake urgency, no generic slop. | The response validator rejects untraceable fact claims, internal leakage, broken output, and excess length; the prompt forbids fake scarcity and cliché fitness copy. |
| `bc-design/SKILL.md` | Brand is authentic, local, inclusive, and not a generic boxing crest or stock-gym cliché. | Persona is direct, coach-like, welcoming to beginners, and mirrors language. It does not invent bravado, staff claims, urgency, or visual gimmicks. |
| Boxing Center real-photography rule | Authentic material beats synthetic substitutes. | If an actual future UI or media reply is built, it must use approved real Boxing Center assets/official logo rather than generated boxing imagery. This V1 sends text only. |
| `Portet/scrapers/output/caliber.json` reference bank | Bespoke interaction principles, not copied layouts. | Future quick replies can become a restrained three- or four-choice control set, e.g. `Voir l’offre`, `Choisir ma salle`, `Voir les disciplines`, `Parler à l’équipe`—only after Meta’s current interactive-message capabilities are verified. |

## What was intentionally not merged

Several local campaign/archive documents carry different price points, seasons, or promotional rules. They are valuable creative references but are not automatically customer-facing knowledge. Mixing them with the live offer would cause a customer-support failure, not a richer design.

The current live page also has a mobile overflow/CTA-density concern: a future landing-page change should use one visual scene at a time, preserve safe-area spacing, and replace unsupported countdown theatre with verified proof. This bot project does not alter that external site.

## Example supported DM shape

```text
BOXING CENTER • OFFRE 29
29,99 € / 4 semaines — sans engagement.

Cours collectifs · accès à 5 salles · 1re échéance par carte.

Tu veux voir l’offre ou choisir ta salle ?
```

That is a composition rule, not a hardcoded claim. The agent uses it only when the relevant current source has been retrieved and approved.
