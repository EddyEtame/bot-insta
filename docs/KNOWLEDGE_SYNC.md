# Weekly corpus poll

Six clubs publish their own plannings, practical information and offers. This document
describes how those pages become answerable facts, why an answer can be refused even
when the page exists, and what to do each time the Sunday report shows a gap.

## The chain

```text
knowledge/registry/gyms.json     the six clubs, their aliases, their sources
        ↓  resolve               a configured URL, or a candidate that proves it is that club's page
        ↓  robots + allowlist    only the club's own hosts, only what robots.txt permits
        ↓  conditional GET       ETag / If-Modified-Since, retry with backoff, byte cap
knowledge/raw/<source>/          timestamped snapshot of what was actually served
        ↓  normalize             sessions, address, hours, offers — with the line they came from
knowledge/normalized/<gym>/      the structured record, per club and per document type
        ↓  render                one source document, scannable, with facts and a check date
knowledge/source/generated/      what retrieval reads
knowledge/metadata/              fetch state, changelog, last report
```

Nothing is published that the pipeline could not identify: a candidate page becomes a
club's page only when it names both the club and Boxing Center. A page fetched from a
host outside the registry is stored as `pending_review` and is never used to answer.

## Running it

```powershell
npm run knowledge:sync          # one pass, writes the corpus
npm run knowledge:sync:dry      # same pass, writes nothing
npm run knowledge:sync -- --gym=balma
npm run knowledge:sync -- --force      # re-probe the clubs whose URL is still unknown
npm run knowledge:sync -- --notify     # also POST the report to ESCALATION_WEBHOOK_URL
npm run knowledge:check         # build controls on the corpus
npm run verify                  # tests + evals + build controls
```

Three ways to get the Sunday run itself:

1. **Inside the server** — `KNOWLEDGE_SYNC_ENABLED=true`. The scheduler targets Sunday
   04:30 Europe/Paris exactly, daylight saving included, re-arms after each run, and
   catches up at boot when the last successful run is more than eight days old. The
   corpus is swapped in memory at the end of the run, so the next DM uses the new
   facts without a restart.
2. **GitHub Actions** — `.github/workflows/releve-dimanche.yml`. Runs the poll, the
   build controls and the evals, then commits the corpus if anything changed.
3. **Windows Task Scheduler** — for a machine that runs the bot without Actions:

```powershell
$action  = New-ScheduledTaskAction -Execute "node" -Argument "scripts/sync-knowledge.js --notify" -WorkingDirectory "C:\chemin\vers\bot-insta"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 4:30am
Register-ScheduledTask -TaskName "Boxing Center — relevé du dimanche" -Action $action -Trigger $trigger
```

## Reading the report

`knowledge/metadata/last-sync.json` holds the machine-readable report; the CLI prints
the same thing in French. Each source ends in one of these states:

| State | Meaning | What to do |
| --- | --- | --- |
| `updated` | the page changed and the corpus was rewritten | read the change list |
| `unchanged` | HTTP 304, or identical bytes | nothing |
| `unresolved` | no URL is confirmed for that source | add the real URL to the registry |
| `failed` | HTTP error, timeout, or unreadable page | check the URL, then the site |
| `blocked` | robots.txt forbids that path | ask the site owner, never bypass |
| `empty` | the page was fetched but carried no publishable fact | the page layout changed — check the normalizer |

`unresolved` is the normal state for a club whose site this repository has never been
told about. Candidate URLs are probed once, then left alone for
`KNOWLEDGE_SYNC_PROBE_COOLDOWN_DAYS` days; `--force` probes again immediately.

## Adding a club's real pages

Open `knowledge/registry/gyms.json` and fill `url` on the source:

```json
{
  "id": "ramonville-planning",
  "docType": "planning",
  "kind": "url",
  "url": "https://www.boxingcenter.fr/ramonville/le-planning",
  "candidates": []
}
```

If the club sits on its own domain, add that host to `hostAllowlist` in the same file —
that list is what makes a fetched fact publishable. A planning that only exists as an
export file is supported too:

```json
{ "id": "ramonville-planning", "docType": "planning", "kind": "file", "file": "ramonville.json" }
```

with `BC_PLANNINGS_PATH` pointing at the folder holding those exports (a clone of the
Plannings repository, for instance). The file may be the site's HTML or a JSON record
shaped like `{ "sessions": [{ "day": "mardi", "start": "18h30", "end": "20h", "discipline": "MMA" }] }`.

## Freshness is part of the answer

Every generated document carries `checkedAt` and a `maxAgeDays` budget:

| Document | Budget | Why |
| --- | --- | --- |
| planning | 10 days | a weekly poll leaves three days of slack before an answer goes quiet |
| offer | 21 days | prices move with campaigns, not with the week |
| profile | 120 days | an address rarely moves, a phone number sometimes does |

Past its budget, a fact stops being evidence. The bot then hands the conversation to
the team instead of quoting a planning nobody has checked. This is visible in
`/health` (`staleSourceCount`, `oldestCheckedAt`) and in the build controls.

## Build controls

`npm run knowledge:check` refuses a corpus that would let a known mistake happen again:

- `VENTE_NEGATIVE` — a source that opens on an absence.
- `FAIT_FAUX` — a claim listed in `knowledge/rules/forbidden-claims.json`.
- `CONTRADICTION` — the same fact key holding two different values.
- `FAITS` — a planning or an offer published without a single fact key.
- `FRAÎCHEUR` — a generated document with no check date.
- `PÉRIMÉ` / `RELEVÉ` — a corpus, or a poll, older than it should be (`--strict` turns
  these into failures, which is what CI uses).

Every mistake that costs something once becomes a check here, so it cannot cost twice.
