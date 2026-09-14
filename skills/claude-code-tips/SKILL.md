---
name: claude-code-tips
description: Activate for any Claude Code session setup, codebase navigation, multi-session work, bash safety, or SDK usage question. Contains Boris's practical tips — codebase Q&A, targeted editing, parallel sessions, multimodal inputs, bash safety rules, and daily workflow optimizations.
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

# CLAUDE CODE PRACTICAL TIPS
## From Boris — Anthropic Applied AI Team

---

## TIP 1 — CODEBASE Q&A BEFORE CODING

Before touching any code, ask Claude to understand the codebase first.

```bash
# Instead of jumping straight to a task:
claude "Explain the overall architecture of this codebase. 
What are the main modules, how do they interact, 
and what should I know before making changes?"
```

**Why this works:** Claude builds a mental map of the codebase. Every subsequent task in the session benefits from this context. Without it, Claude edits code blindly.

**For the BC project:** Before building any BC workflow or integration, ask Claude to map the existing structure first — even if that structure is just a folder of assets and a WordPress site.

---

## TIP 2 — TARGETED FILE EDITING (not full rewrites)

Tell Claude exactly which file and which section to touch. Never say "fix the code" — say "in file X, function Y, change Z."

```bash
# Vague (bad):
claude "Fix the landing page"

# Targeted (good):
claude "In /wp-content/themes/bc-theme/page-offre-ete.php, 
in the pricing section div (class: price-hero), 
change the displayed price from 150 to 89 
and add a strikethrough on the original price."
```

**The rule:** The more specific the target, the less Claude hallucinates changes elsewhere.

---

## TIP 3 — PARALLEL SESSIONS FOR INDEPENDENT TASKS

Run multiple Claude Code sessions simultaneously for tasks that don't depend on each other.

```bash
# Terminal 1: Working on the site
claude "Build the Portet website home page"

# Terminal 2: Simultaneously working on campaigns  
claude "Write all Meta Ads copy for the 4 axes"

# Terminal 3: Simultaneously handling CRM
claude "Draft the SMS, WhatsApp and email templates"
```

**Why:** A single session is sequential. Parallel sessions multiply throughput. For the BC sprint (June 4-12), this is how you compress 10 days of work into 4.

**Context isolation:** Each session has its own context window. Don't expect Session 2 to know what Session 1 did — pass relevant outputs explicitly.

---

## TIP 4 — MULTIMODAL INPUTS

Claude Code can process images, PDFs, and other files alongside text prompts.

```bash
# Pass a screenshot of a design for analysis
claude "Here is the current flyer [image attached]. 
List every text error and formatting issue you see."

# Pass a PDF plan
claude "Here is the BC communication plan [PDF attached]. 
Extract all deadlines into a structured task list."

# Pass a photo for content generation
claude "Here is a photo of the BC gym [image attached]. 
Write 3 Instagram captions for this image, 
targeting women beginners aged 20-35."
```

**For BC project:** This is extremely useful for design review. Upload a Grok output to Claude Code and ask for a precise diagnosis before writing a correction prompt.

---

## TIP 5 — BASH SAFETY RULES

Claude Code can run bash commands. These rules prevent disasters:

```
NEVER run without understanding:
- rm -rf (recursive delete — irreversible)
- Any command with sudo on production systems
- Any command that modifies live databases
- Any deploy command without a staging test first

ALWAYS ask Claude to explain before running:
"What exactly will this command do before you run it?"

ALWAYS use --dry-run when available:
claude "Show me what files would be affected by this change 
before making any modifications"
```

**The mental model:** Treat Claude Code bash access like giving a capable intern access to the production server. Smart, fast, helpful — but needs guardrails.

---

## TIP 6 — THE SDK FOR CUSTOM INTEGRATIONS

The Anthropic SDK lets you call Claude programmatically from any application.

```python
import anthropic

client = anthropic.Anthropic()

# Basic call
message = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Your task here"}]
)

# With system prompt (persona/skill injection)
message = client.messages.create(
    model="claude-opus-4-5",
    max_tokens=1024,
    system="You are the BC campaign manager. [BC-master skill content here]",
    messages=[{"role": "user", "content": "Generate this week's social posts"}]
)
```

**For BC workflow:** When we build the automated BC workflow system, the SDK is how Claude integrates with Meta Ads API, Google Ads API, Brevo (email/SMS), and the WordPress site. Each integration is a function call that Claude orchestrates.

---

## TIP 7 — CONTEXT WINDOW MANAGEMENT IN LONG SESSIONS

Long sessions fill up the context window. When Claude starts forgetting earlier context:

```bash
# Summarize and restart approach:
claude "Summarize everything we've accomplished in this session 
and the current state of each task. I'll use this to start a fresh session."

# Then start new session with the summary as context:
claude --system "Previous session summary: [paste summary here]" "Continue from here..."
```

**Signs the context is full:** Claude starts repeating earlier mistakes, seems to forget decisions made earlier, or produces output inconsistent with established direction.

**Prevention:** Save important decisions, text, and outputs to files regularly. Files persist. Context windows don't.

---

## TIP 8 — DAILY WORKFLOW STRUCTURE

```
Morning (session start):
1. Load relevant skills: bc-master + today's focus skill
2. State the day's priority: "Today we are completing X, Y, Z"
3. Ask Claude to confirm understanding before starting

During work:
4. Save outputs to files as you go — don't rely on scroll
5. Use parallel sessions for independent tasks
6. After each major output, ask: "Does this match the brief?"

End of session:
7. Ask Claude to summarize what was completed
8. Ask for a list of what's remaining with priorities
9. Save summary to a running project log file
```

---

## QUICK REFERENCE — CLAUDE CODE COMMANDS

```bash
claude                          # Start interactive session
claude "task description"       # Single-shot task
claude --continue               # Resume previous session
claude --model opus             # Use most capable model
claude --background "task"      # Run as background agent
claude routine create name      # Create a scheduled routine
claude routine list             # See all routines
claude --dry-run                # Preview without executing
claude --print "task"           # Non-interactive output
```
