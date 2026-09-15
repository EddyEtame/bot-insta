# Going live: credentials, hosting, back office

Three things stand between the current repository and a real DM being answered: the
credentials Meta and OpenAI hand out, a machine that Meta can reach at a stable HTTPS
address, and a back office that decides what actually leaves the building.

## 1. Every environment variable, and exactly where it comes from

### You invent it

| Variable | What to do |
| --- | --- |
| `META_VERIFY_TOKEN` | Generate a long random string and keep it. You type the same value twice: in `.env` and in Meta's webhook configuration. It proves the callback belongs to you. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | Whatever the host expects. 3000 locally; behind Caddy or Fly, keep 3000 and let the proxy publish 443. |

### Meta app dashboard — [developers.facebook.com/apps](https://developers.facebook.com/apps)

Create a **Business**-type app for Boxing Center, then:

| Variable | Where |
| --- | --- |
| `META_APP_SECRET` | App settings → Basic → **App secret** → Show. This is what validates the `X-Hub-Signature-256` of every incoming event. Treat it like a password: it never leaves the server. |
| `META_API_VERSION` | The version your app shows in the dashboard (of the form `v23.0`). Do not copy a version from a tutorial — check the one your app is on, and the [Graph API changelog](https://developers.facebook.com/docs/graph-api/changelog) before bumping it. |
| `INSTAGRAM_API_MODE` | `instagram_login` if you connect the Instagram professional account directly (sends to `graph.instagram.com`). `facebook_login` if the account is connected through a Facebook Page (sends to `graph.facebook.com`). Pick one and stay on it — they use different tokens and different endpoints. |

**Mode `instagram_login`** — add the **Instagram** product, then *API setup with Instagram
business login*. Connect the Boxing Center account and generate a token there.

| Variable | Where |
| --- | --- |
| `INSTAGRAM_ACCESS_TOKEN` | The token generated on that screen, with the scopes `instagram_business_basic` and `instagram_business_manage_messages`. It is long-lived, not eternal: refresh it with `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=…` before it lapses. Put a reminder in the Sunday routine. |
| `INSTAGRAM_ACCOUNT_ID` | Leave empty. This mode posts to `/me/messages`. |

**Mode `facebook_login`** — the Instagram account must be linked to a Facebook Page you
administer.

| Variable | Where |
| --- | --- |
| `INSTAGRAM_ACCESS_TOKEN` | A **Page** access token carrying `instagram_basic`, `instagram_manage_messages`, `pages_messaging` and `pages_manage_metadata`. Generate it in the Graph API Explorer, exchange it for a long-lived one (`GET /oauth/access_token?grant_type=fb_exchange_token&…`), then read `/me/accounts` to get the Page token. For something that never expires, create a **System User** in Business Manager and issue the token there — that is the version to run in production. |
| `INSTAGRAM_ACCOUNT_ID` | `GET /me/accounts?fields=name,instagram_business_account` → the `instagram_business_account.id` of the Boxing Center Page. |

**Two settings that are not variables and will silently block everything:**

- In the Instagram app itself: Settings → Messages and story replies → **Connected tools
  → Allow access to messages**. Off by default; nothing arrives while it is off.
- **Advanced access** on the messaging permission, which means App Review and business
  verification. Without it you can only exchange messages with people who hold a role on
  the app (you, your testers). Do the whole acceptance test in that mode first.

**The 24-hour window.** Meta lets you answer a person within 24 hours of *their* last
message. After that a standard reply is refused. This is not a detail for a back office
where a human approves drafts: a draft that waits until tomorrow is a draft that can no
longer be sent. The queue has to show that countdown, and mark what it lost.

### OpenAI — [platform.openai.com](https://platform.openai.com)

| Variable | Where |
| --- | --- |
| `OPENAI_API_KEY` | Settings → API keys → Create new secret key. Scope it to a dedicated project so you can read the spend of this bot alone, and so revoking it breaks nothing else. Add credit to the account or every call fails. |
| `OPENAI_MODEL` | A model id your account exposes — the list lives at [platform.openai.com/docs/models](https://platform.openai.com/docs/models). The repository defaults to `gpt-5-mini`; check the id is live on your account before trusting it. |

### Yours to choose

| Variable | Value to use in production |
| --- | --- |
| `SESSION_STORE` / `SESSION_STORE_PATH` | `file`, on the persistent disk (e.g. `/data/sessions.json`). Conversations and delivery ids then survive a restart. |
| `SESSION_TTL_HOURS` | `24` unless legal says otherwise. It is a retention policy, not a cache setting: these are customers' private messages. |
| `MAX_MESSAGES_PER_MINUTE` | `8`. Raise only if real traffic justifies it. |
| `ESCALATION_WEBHOOK_URL` | Where a handover lands: a Slack/Make/n8n webhook, or the back office's own endpoint once it exists. Empty is valid — escalations are then only logged. |
| `KNOWLEDGE_SYNC_ENABLED` | `true` on the server that owns the corpus, so the Sunday poll runs in process and swaps the corpus without a restart. Leave `false` if GitHub Actions stays the only poller. |
| `KNOWLEDGE_SYNC_USER_AGENT` | Keep the default, with a contact address the club actually reads. Sites block anonymous crawlers, and rightly so. |
| `KNOWLEDGE_BASE_PATH` | The corpus on the persistent disk, or the repository checkout if the machine pulls from git. |
| Everything else `KNOWLEDGE_SYNC_*` / `KNOWLEDGE_MAX_AGE_*` | Defaults. They are tuned and documented in [KNOWLEDGE_SYNC.md](KNOWLEDGE_SYNC.md). |

### Where each value physically lives

- **Local**: `.env`, never committed.
- **Server**: the host's secret store (`fly secrets set`, systemd `EnvironmentFile` with
  `chmod 600`, or the panel's environment tab). Not in the image, not in git.
- **GitHub Actions**: only what the weekly poll needs — `ESCALATION_WEBHOOK_URL` as a
  repository *secret*, `KNOWLEDGE_SYNC_USER_AGENT` as a repository *variable*. The poll
  reads public pages; it must never be given the Meta or OpenAI credentials.

## 2. Hosting

### On "bot hosting" services

The cheap plans sold as *bot hosting* are built for Discord and Telegram bots, which open
an outbound connection and keep it. This bot is the opposite shape: **Meta calls us**. So
whatever the host, it has to provide all five of these, or it is the wrong tool:

1. A **stable public HTTPS address** with a real certificate. Meta verifies the callback
   URL once and then signs every delivery to it; a URL that rotates breaks the
   subscription.
2. **No sleeping.** A container that idles down misses DMs. Meta retries, but not forever,
   and a customer who waited an hour has already gone to the gym down the road.
3. A **persistent disk**. Sessions, deduplication, the corpus and the back office database
   cannot live in an ephemeral filesystem.
4. **EU hosting and a real contract.** We store customers' private messages: that is
   personal data. The host is a processor and owes you a DPA. A hobby panel with no
   named legal entity is not somewhere to put a club's customer conversations.
5. Somewhere **Cloudflare Access** can sit in front of `/admin`.

A bot-hosting plan that genuinely offers a domain, a volume and no sleep will run this.
Most do not, and none of them will sign a data processing agreement.

### What to take instead

A **small VPS in France** — Scaleway, OVH or Hetzner, 4 to 6 € a month:

```
Cloudflare (DNS + Access)  →  Caddy (HTTPS, auto-renewed)  →  Node (bot + /admin)
                                                              └→ /data  (SQLite, corpus, sessions)
```

- Meta's callback: `https://bot.boxingcenter.fr/webhooks/instagram`
- Back office: `https://bot.boxingcenter.fr/admin`, behind Cloudflare Access
- Deployment: GitHub Actions pushes on merge to `main`; `npm ci && npm test` first, then restart
- Backups: a nightly copy of `/data` — it holds conversations, so treat it as such

Running total: ~5 €/month of machine, ~10 €/year of domain, Cloudflare free, plus OpenAI
usage which is a fraction of a cent per answered DM.

Fly.io in region `cdg` with a 1 GB volume gives the same five properties without a machine
to administer, at a slightly higher running cost. Either is fine; the VPS keeps everything
in one place and under your hand.

## 3. Back office

### The change it forces in the engine

Today the pipeline sends as soon as the answer passes validation. The back office needs a
step between: an **outbox**. A decision produces a *draft*; the draft waits in a queue;
something — a human, or the autonomy setting — releases it.

```text
message → decision → validated draft → outbox(pending) → [approve | edit | take over] → send
                                              └── autonomy setting can release it on its own
```

Three modes, stored in the database and switched from the interface, never from a redeploy:

| Mode | What goes out alone |
| --- | --- |
| `review_all` | Nothing. Every message waits for a click. **This is how we launch.** |
| `review_facts` | Only the fixed handovers ("I'm passing this to the team", "which club do you mean?"), which cannot be wrong. Anything asserting a fact waits. |
| `auto` | Everything, with a stop button and the journal to read afterwards. |

The move from one to the next is the **autonomy button**, and it is only honest if you can
see what you are trusting: the switch sits next to the last 50 decisions and their outcome,
so it is a judgement, not a leap.

### The screens

1. **Inbox** — conversations, newest first. For each: the customer's message, the evidence
   that was retrieved *with its check date*, the draft, and three actions — send, edit and
   send, take over. A countdown on the 24-hour window, visible before it matters.
2. **Queue** — everything pending, oldest first, with what is about to expire at the top.
3. **Autonomy** — the switch above, per category (planning / offers / address / handover),
   with who flipped it and when.
4. **Corpus** — the five clubs. The season plannings, editable here rather than by hand in
   JSON; the fetched sheets, read-only with their source and date; the offers; the
   forbidden claims. A "poll now" button and the last report.
5. **Journal** — every send, and above all every *refusal*: unsourced figure, absence-led
   opening, forbidden claim. That page is what earns the autonomy button its click.

### Technically

Same repository, same process, same deployment: Express serves `/admin` as server-rendered
HTML with a little JavaScript. No second app, no SPA, nothing extra to keep alive.
SQLite on `/data` holds conversations, drafts, the audit trail and the settings; the corpus
stays in files, versioned in git, because its history is worth as much as its content.
Cloudflare Access handles who gets in — the app reads the identity header it forwards and
writes it into the audit trail, so the journal says *who* sent what.
