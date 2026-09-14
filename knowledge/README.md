# Knowledge corpus

```text
knowledge/
  registry/gyms.json     the six clubs: ids, aliases, hosts, and the sources to poll
  source/                curated business facts, reviewed by a human
  source/generated/      documents written by the weekly poll — never edited by hand
  rules/persona.md       tone and conversation design, never retrieved as evidence
  rules/forbidden-claims.json   truth controls applied to every outgoing reply
  normalized/<gym>/      structured records per club: planning.json, profile.json, offers.json
  metadata/              fetch state, changelog, last report
  raw/                   timestamped snapshots of what each site actually served (ignored by Git)
  indexes/               generated manifest (ignored by Git)
```

`source/` contains only facts approved for customer-facing replies. Do not point
ingestion at the whole Desktop, an archive, or private Boxing Center folders.

Each source records its visibility, authority, provenance URL, effective dates, check
date, freshness budget, the clubs it applies to, and its factual keys. Retrieval
excludes anything internal, unverified, out of its effective window, past its freshness
budget, or belonging to a club the customer did not ask about.

**Curated versus generated.** A file in `source/` is yours: the poll never touches it.
A file in `source/generated/` belongs to the poll and is rewritten whenever the club's
page changes — edit the page, or the registry, not the file.

**One fact, one place, one source, one date.** A fact key holds a single value across
the whole corpus. Two sources disagreeing on the same key is a build failure
(`npm run knowledge:check`) and, at conversation time, an escalation rather than a
silent merge.

After changing anything here:

```powershell
npm run knowledge:check      # build controls
npm run knowledge:index      # regenerate the manifest
npm run evals                # the bot still answers what it should, and refuses what it must
```
