---
name: claude-routines
description: Activate when building proactive Claude Code agents, scheduled tasks, event-based triggers, or automated workflows. Contains the full routines system — @cron syntax, event triggers, proactive notifications, background agents, and real-world automation patterns.
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

# CLAUDE ROUTINES — Proactive Agents & Automation
## From Maya — Anthropic Applied AI Team

---

## WHAT ROUTINES ARE

Routines are **proactively triggered Claude Code agents** — Claude doing work automatically without a human sending a message first. Instead of waiting for input, Claude can:
- Run on a schedule (cron)
- React to events (file changes, webhook calls, system triggers)
- Monitor conditions and alert when something changes
- Run background maintenance tasks overnight

This transforms Claude from a reactive assistant into an autonomous collaborator.

---

## ROUTINE TYPES

### 1. Scheduled Routines (@cron)
Run at specific times or intervals.

```
@cron("0 9 * * 1-5")  → Every weekday at 9am
@cron("0 0 * * *")    → Every day at midnight  
@cron("0 */4 * * *")  → Every 4 hours
@cron("@weekly")      → Once a week
@midnight             → Shorthand for daily midnight run
```

**Use cases:**
- Daily campaign performance reports for BC (pull Meta Ads stats each morning)
- Weekly social media calendar generation
- Nightly backup of design assets
- End-of-week summary: leads captured, conversions, cost per lead

### 2. Event-Based Routines
Triggered by specific conditions, not time.

```
@on_file_change("campaigns/")  → When any file in campaigns/ changes
@on_webhook(url)               → When external service sends a call
@on_condition(check_function)  → When a custom condition becomes true
```

**Use cases:**
- When a new photo is added to the BC assets folder → auto-generate social post options
- When campaign spend hits a threshold → send alert
- When a lead form is submitted → trigger follow-up sequence

### 3. Background Agents
Long-running agents that work in the background while you do other things.

```
# Start a background monitoring agent
claude --background "Monitor Meta Ads spend every 30 min. 
Alert if CPC exceeds 2€ or CTR drops below 1%."
```

---

## ROUTINE STRUCTURE

A routine is a Claude Code script with a trigger declaration at the top:

```python
# routine: daily_bc_report.py
# trigger: @cron("0 8 * * *")  — runs every day at 8am

"""
Daily Boxing Center Campaign Report
Pulls: Meta Ads performance, lead count, top performing creative
Sends: Summary to team WhatsApp or email
"""

# Claude handles the rest of the logic
```

---

## REAL-WORLD PATTERNS FOR BC PROJECT

### Pattern 1 — Daily Campaign Monitor
```
Routine: Every morning at 8:00
Task: Pull yesterday's Meta Ads data
Check: CPC vs target, CTR vs benchmark, leads vs daily goal
Output: 3-line summary → send to designated channel
Alert: If any metric is >20% off target → flag immediately
```

### Pattern 2 — Social Media Auto-Draft
```
Routine: Every Sunday evening
Task: Look at next week's editorial calendar
Pull: BC photo assets available
Draft: 3 posts for the week with suggested captions and hashtags
Output: Draft file for human review before scheduling
```

### Pattern 3 — Lead Response Monitor
```
Routine: Every 2 hours during campaign (12→26 June)
Task: Check if any leads submitted from landing page
Flag: Any lead older than 2 hours with no follow-up
Output: Alert to secretariat.boxingcenter@gmail.com
```

### Pattern 4 — Weekly Performance Digest
```
Routine: Every Friday at 17:00
Task: Compile week's metrics (impressions, clicks, leads, sales)
Compare: Against previous week
Generate: Simple chart + 3 key insights
Send: To boss for weekend review
```

---

## PROACTIVE NOTIFICATIONS

Routines can push notifications without waiting to be asked:

```python
# When to notify proactively:
- Unusual spend spike detected
- Campaign CTR dropped significantly  
- Lead volume below target for 2 days running
- A scheduled post failed to publish
- An A/B test has reached statistical significance
```

**The key insight from Maya:** The most powerful use of routines is not automation for its own sake — it's **eliminating the cognitive load of monitoring**. The boss should never have to wonder "how is the campaign doing?" — the routine tells him before he asks.

---

## WHAT ROUTINES CANNOT DO (current limits)

- Cannot make financial decisions autonomously
- Cannot publish to live channels without human approval (best practice)
- Cannot access external APIs without proper authentication setup
- Run time limits apply — long tasks need to be chunked

---

## SETTING UP A ROUTINE IN CLAUDE CODE

```bash
# Create a routine file
claude routine create daily_report --trigger "@cron(0 8 * * *)"

# Test the routine manually before scheduling
claude routine run daily_report --dry-run

# Activate the routine
claude routine activate daily_report

# List all active routines
claude routine list
```

---

## THE MENTAL MODEL

Think of routines as **team members who work while you sleep.**

The creative director (you + Claude) sets the strategy.
The routines execute the monitoring, reporting, and flagging.
Every morning you wake up to a briefing, not a blank screen.

For the BC campaign: the 15-day window from June 12→26 is where routines pay off most. Manual daily monitoring of ads is expensive in time. One routine handles it, surfaces only what matters, flags only what needs human attention.
