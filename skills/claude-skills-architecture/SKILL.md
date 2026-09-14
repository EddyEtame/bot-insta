---
name: claude-skills-architecture
description: Activate when creating, editing, or structuring any Claude Code skill file. Contains the full architecture of skills from Anthropic engineers — what goes in frontmatter, how to write descriptions, body structure, when to split into multiple skills, and the lazy system prompt mental model.
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

# CLAUDE SKILLS ARCHITECTURE
## From Daisy Holman & Will — Anthropic Applied AI Team

---

## WHAT A SKILL IS

A skill is a **lazy system prompt** — a folder containing a `SKILL.md` file that Claude can pull into context only when it recognizes it needs it. The description goes into the system prompt (always loaded, always visible). The body is pay-per-use (loaded on demand, only when relevant).

This architecture solves the fundamental problem: **system prompts get too long over time** as requirements accumulate. Skills let you modularize that knowledge.

---

## THE CORRECT FILE FORMAT

```markdown
---
name: skill-name-in-kebab-case
description: One-line sentence describing when to activate this skill and what it contains. This line lives in the system prompt permanently.
---

# Skill Title

## Section 1

Content here...
```

### Frontmatter requirements (ALL three fields required):
- `name` — kebab-case identifier, matches the folder name
- `description` — the always-loaded trigger sentence (keep under 30 words)

### What goes in the description (the system prompt line):
- **When** to activate ("Activate when...")
- **What** it contains ("Contains...")
- **Why** it's useful ("Load before...")

### What goes in the body:
- Full detailed instructions
- Reference tables
- Code examples
- Decision trees
- Everything Claude needs once it decides this skill is relevant

---

## THE MENTAL MODEL — TWO ZONES

```
ZONE 1 — ALWAYS IN CONTEXT (description only):
"Activate for any Boxing Center task. Contains campaign brief."
→ Claude sees this every turn. Uses it to decide: do I need this skill?

ZONE 2 — PULLED IN ON DEMAND (the body):
The full skill content — photos, axes, protocols, etc.
→ Claude loads this only when it recognizes the task needs it.
```

This is why the description must be precise — it's the classifier that decides when to load the body.

---

## WHEN TO SPLIT INTO MULTIPLE SKILLS

**One skill per domain of expertise.** Do not combine unrelated topics.

Split when:
- Two topics have different activation triggers
- One section is rarely needed when the other is active
- The combined file would exceed ~2,000 words
- Different team members or agents need different subsets

**Example from BC project:**
- `bc-master` → campaign identity and axes (loaded for any BC decision)
- `bc-design` → visual system (loaded only for design tasks)
- `bc-photos` → photo library (loaded only when choosing images)
- `bc-grok-protocol` → prompting rules (loaded only when writing Grok prompts)

Each is a different activation context. Don't merge them.

---

## WHAT TO PUT IN SKILLS VS SYSTEM PROMPT

```
SYSTEM PROMPT (always loaded):
→ Who Claude is in this session
→ What tools are available
→ Core behavioral rules
→ Skill descriptions (auto-injected)

SKILLS (loaded on demand):
→ Domain-specific knowledge
→ Reference data (tables, photo libraries, color codes)
→ Process instructions for specific task types
→ Historical decisions and context
→ Templates and examples
```

**Rule from Will:** Leave in the system prompt only what Claude needs for EVERY single task. Pull everything else into skills.

---

## DESCRIPTION WRITING GUIDE

The description is the most important line in the skill. Write it like a trigger condition.

**Bad descriptions:**
- "Information about the project" (too vague — Claude can't tell when to load it)
- "Use this for everything" (never specific enough)
- "Boxing Center skill" (no activation logic)

**Good descriptions:**
- "Activate for any Boxing Center campaign task. Contains creative axes, boss brief, timeline, and LLM Council framework."
- "Activate before writing any Grok prompt. Contains Grok's failure modes, proven prompt architecture, and French text rules."
- "Activate when deciding which BC photo to use. Contains complete 20-image library with descriptions and recommended assignments."

**Formula:** `[Activate when X]. Contains [Y and Z]. Load before [specific action].`

---

## SKILL BODY STRUCTURE — BEST PRACTICES

From Daisy's talk on making skills effective:

1. **Lead with the most-used information** — don't bury critical rules at the bottom
2. **Use tables for reference data** — easier for Claude to parse than prose lists
3. **Include decision trees** — explicit if/then logic reduces ambiguity
4. **Write rules as rules, not suggestions** — "Never do X" not "Try to avoid X"
5. **Include examples of correct AND incorrect behavior** — negative examples help as much as positive ones
6. **Version your skills** — add `## Version` section at bottom noting when last updated

---

## THE CONTEXT WINDOW PLACEMENT RULE

From Daisy: **Stable shared information goes at the FRONT. Volatile per-task information goes at the END.**

```
FRONT of context:
→ System prompt (identity, tools, skill descriptions)
→ Stable skills (project master, design system)

END of context:
→ Current task details
→ Recent conversation
→ Per-task variables (which photo, which axis, which format)
```

---

## SKILL FOLDER STRUCTURE

```
/skills/
  skill-name/
    SKILL.md    ← required, contains frontmatter + body
    examples/   ← optional, sample outputs
    assets/     ← optional, referenced files
```

The folder name becomes the fallback name if `name` field is missing — always include the `name` field explicitly.
