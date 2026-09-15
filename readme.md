# Boxing Center Instagram Support Agent

A secure Node.js service that answers Instagram DMs for the five Boxing Center clubs. It
receives a signed Meta webhook, normalizes the DM, applies deterministic safety and
business rules, retrieves only approved knowledge **for the club the customer actually
named**, asks OpenAI to compose a grounded answer, validates that answer against the
evidence, then replies through the official Instagram API.

Every Sunday it re-reads the clubs' own pages — plannings, practical information,
offers — and rewrites its corpus. A fact it has not checked recently stops being an
answer and becomes a handover.

This is deliberately not a generic `message → model → answer` bot.

## What is implemented

```text
Instagram DM
  → signed Meta webhook
  → normalized platform message + internal hashed session ID
  → query analysis: which club, which day, which discipline, which kind of fact
  → classification / rate / policy decision
  → retrieval scoped to that club, inside its freshness budget
  → ANSWER | CLARIFY | ESCALATE | IGNORE | REFUSE
  → source-traced AI composition (ANSWER only)
  → validation: sources, figures, forbidden claims, no absence-led selling
  → Instagram reply and optional human escalation

every Sunday 04:30 Europe/Paris
  → registry of the open clubs
  → robots-aware, allowlisted, conditional fetch of each club's pages
  → snapshot → normalize → diff → corpus → changelog → report
  → live corpus swapped in memory, no restart
```

## The five clubs

`knowledge/registry/gyms.json` holds Saint-Cyprien, États-Unis, Minimes, Ramonville and
Portet: their official spelling, the ways customers actually write them (`st cyp`,
`portet sur garonne`, `route d'espagne`), and the sources to poll for each —
`boxingcenter.fr`, the boutique, `boxing-center-portet.fr`, `club-boxe-toulouse.com`,
`mmatoulouse.com` and `clubmma.fr`. Balma has closed and is out of the registry, so the
name is no longer a club the bot recognises or answers for.

**Every open club answers from its real 2026-2027 season planning**, transcribed slot by
slot from the club's own posters into `knowledge/exports/plannings/`: Saint-Cyprien (29),
États-Unis (46 across salle boxe, boxing fitness and salle MMA), Minimes (27), Portet (31,
marked provisional as the poster is) and Ramonville (22). Each export carries the date a
human verified it, and the poll republishes it without ever pretending to have checked it
itself.
The registry is the only place a club is declared; everything else derives from it —
detection in a message, retrieval scope, corpus layout, coverage reporting, and the
"which club do you mean?" question.

A planning for one club can never answer a question about another. That is a hard
filter, not a ranking preference.

## Design translation

Instagram is a conversational surface, not a dashboard. The project translates Boxing
Center's strongest visual discipline into DM behavior: a decisive factual opening, clear
price/proof hierarchy, compact language, one useful CTA, and zero generic fitness copy.
See [DESIGN_TRANSLATION.md](docs/DESIGN_TRANSLATION.md) for the evidence and the choices.

Two rules from that discipline are enforced in code, not in prose:

- **An answer never opens on an absence.** "Il n'y a pas de…" is refused before it is
  sent; the reply leads with what exists.
- **Every figure comes from a retrieved source.** A price, an hour or a duration the
  evidence does not carry is rejected, and the conversation is handed over.

## Requirements

- Node.js 20+ (Node 22 is installed locally)
- An Instagram professional account and a Meta developer app
- A current, Meta-approved messaging configuration for the chosen API mode
- An OpenAI API key

For customers outside your Meta app roles, Meta may require advanced access/review.
Verify the current permissions, account eligibility, webhook product, and API version
directly in your Meta dashboard before a live test.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run verify      # tests, evals, corpus controls
npm run dev
```

`.env` is ignored by Git. Never commit it or paste its values into source, logs, or documentation.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `META_VERIFY_TOKEN` | Your own high-entropy webhook verification value. |
| `META_APP_SECRET` | Validates Meta's `X-Hub-Signature-256` request signature. |
| `META_API_VERSION` | The current supported version verified in your Meta app. |
| `INSTAGRAM_API_MODE` | `instagram_login` or `facebook_login`. |
| `INSTAGRAM_ACCOUNT_ID` | Required for `facebook_login`; not a substitute for a token. |
| `INSTAGRAM_ACCESS_TOKEN` | Server-side Instagram authorization credential. |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI server-side configuration. |
| `KNOWLEDGE_BASE_PATH` | Path to the curated knowledge corpus, default `./knowledge`. |
| `SESSION_STORE` / `SESSION_STORE_PATH` | `memory` or `file`; file keeps conversations and delivery ids across restarts. |
| `SESSION_TTL_HOURS` | Session retention; 24 by default, enforced on read, write and load. |
| `MAX_MESSAGES_PER_MINUTE` | Per-session cost-control threshold; 8 by default. |
| `ESCALATION_WEBHOOK_URL` | Optional private destination for escalations and the weekly report. |
| `KNOWLEDGE_SYNC_*` | The weekly poll: on/off, day, hour, time zone, user agent, timeouts, caps, politeness delay. |
| `KNOWLEDGE_MAX_AGE_*_DAYS` | Freshness budget per document type, in days. |

`INSTAGRAM_ACCESS_TOKEN` is used only by the transport adapter. For `instagram_login`,
it sends to `https://graph.instagram.com/{version}/me/messages`; for `facebook_login`,
to `https://graph.facebook.com/{version}/{instagram-account-id}/messages`.

## Knowledge corpus

```text
knowledge/
  registry/gyms.json     the open clubs and the sources to poll
  exports/plannings/     season plannings handed over by the club, with their verification date
  source/                curated facts, reviewed by a human
  source/generated/      written by the weekly poll, never by hand
  rules/                 persona and truth controls
  normalized/<gym>/      structured planning, profile and offer records
  metadata/              fetch state, changelog, last report
  raw/                   snapshots of what each site served (ignored by Git)
```

Each source records provenance, visibility, verification status, effective dates, check
date, freshness budget, the clubs it covers, and its fact keys. Retrieval excludes
internal, unverified, expired, stale, and other-club sources. A factual reply may cite
only source IDs that were actually retrieved. See [knowledge/README.md](knowledge/README.md).

## The weekly poll

```powershell
npm run knowledge:sync            # one pass
npm run knowledge:sync:dry        # nothing is written
npm run knowledge:sync -- --gym=balma --force
npm run knowledge:check           # build controls
```

Set `KNOWLEDGE_SYNC_ENABLED=true` and the server polls by itself every Sunday at 04:30
Europe/Paris, then swaps the corpus in memory. `.github/workflows/releve-dimanche.yml`
does the same on GitHub and commits what changed. Full operations manual, including the
Windows Task Scheduler recipe and what each source state means:
[docs/KNOWLEDGE_SYNC.md](docs/KNOWLEDGE_SYNC.md).

The fetcher is deliberately narrow: HTTPS only, hosts from the registry only, robots.txt
obeyed on every hop, redirects re-checked against the allowlist, conditional requests,
byte caps, politeness delay, bounded retries. A page that does not identify itself as
that club's page is never published.

## Decision policy

| Situation | Action |
| --- | --- |
| Approved, fresh, club-matching evidence | `ANSWER` through the AI composer |
| Vague message | `CLARIFY` without an AI call |
| Club-specific question with no club named | `CLARIFY` listing the open clubs |
| Club named, but no knowledge of that kind for it | `ESCALATE` — a club-wide page never stands in |
| Evidence exists but is past its freshness budget | `ESCALATE` |
| Question about a club the corpus does not cover yet | `ESCALATE` |
| Privatisation, entreprise, cours particulier, stage, certificat — unless the evidence covers it | `ESCALATE` |
| Human request, payment/refund/privacy/contract issue, unknown fact, source conflict | `ESCALATE` |
| Prompt injection or request for internal/private material | `REFUSE` |
| Spam, duplicate, blank, or rate-limited event | `IGNORE` / no reply |

The model never decides whether it is safe to answer. It composes an already-approved
answer from retrieved public evidence. Output that is empty, too long, untraceable,
secret-like, absence-led, contradicting a truth control, or carrying a figure no source
supports is rejected and escalated.

## Going live

Where every credential comes from (Meta, OpenAI), what a host has to provide for a webhook
this shape, and the back office that decides what actually gets sent:
[docs/MISE_EN_LIGNE.md](docs/MISE_EN_LIGNE.md).

## Webhook setup and local test

The server exposes:

- `GET /webhooks/instagram` — Meta verification challenge
- `POST /webhooks/instagram` — HMAC-validated event ingestion
- `GET /health` — configuration, corpus readiness, per-club coverage, staleness and last
  poll, without secret values

```powershell
npm run dev
cloudflared tunnel --url http://localhost:3000
```

In the Meta app dashboard, set the callback URL to
`https://YOUR-TUNNEL.trycloudflare.com/webhooks/instagram`, enter the same
`META_VERIFY_TOKEN`, subscribe to the applicable Instagram `messages` webhook field, and
use the exact current API/version/permission configuration Meta shows for the account.

## Controlled real-DM acceptance test

1. Add real credentials only to the local `.env`.
2. Run `npm run knowledge:sync` once and confirm `/health` returns `200` with at least
   one public source and the clubs you expect under `coverage`.
3. Configure and verify the tunnel callback in Meta.
4. From an eligible Instagram test account, ask: `Quel est le prix de l'offre 29 ?`
5. Confirm the log records an `ANSWER`, the source ID, and a successful send — never token values.
6. Ask `C'est quoi le planning du mardi ?` and confirm the bot asks which club.
7. Ask the same question naming a club with no corpus yet and confirm an `ESCALATE`
   payload instead of a borrowed answer.
8. Ask for a human or for internal instructions; confirm the deterministic
   escalation/refusal path without an AI call.

## Tests and evals

```powershell
npm test          # 54 tests: retrieval, fetching, normalizing, guards, scheduling, end-to-end DMs, shipped corpus
npm run evals     # 21 cases: contrôle / bord / limite, plus D0 anti-drift, no API call
npm run evals:live  # same cases, composed by the real model, validated as in production
```

The eval bench imports the real decision path, the real prompt builder and the real
validator — never a copy, because a copy drifts and a bench that drifts lies better than
it measures. `D0` costs no API call and fails the moment the registry, the prompt and the
code stop describing the same world.

## Current limits and next steps

- No real Instagram credentials or Meta app configuration are in this workspace, so a
  live end-to-end DM has not been claimed as complete.
- Every open club has its 2026-2027 planning; **no club has its practical sheet yet** —
  address, phone and opening hours come from the clubs' own pages, which the Sunday poll
  fetches. Until a page resolves, an address question goes to the team, not to a guess.
- Portet's planning is marked **provisoire** on the poster, and the corpus says so.
- Web fetching has never run against the real domains from this workspace (its egress
  policy blocks them); the first real `npm run knowledge:sync` will say which pages
  resolve and which need their URL written into the registry.
- Rate limits and the in-memory index are still per-process; sessions and deduplication
  are durable when `SESSION_STORE=file`. Use shared storage and a queue before running
  more than one instance.
- Add new sources only after factual review. Do not bulk-ingest private folders, security
  material, unreviewed archive content, or pages that contradict the current official offers.
- WhatsApp, CRM, email, or dashboard escalation adapters should be added only through
  their official APIs.
