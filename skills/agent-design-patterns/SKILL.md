---
name: agent-design-patterns
description: Activate when designing multi-step agents, choosing between tools vs skills vs sub-agents, building evaluation systems, or architecting any automated workflow. Contains Will's agent design patterns — primitives, tool selection, sub-agent orchestration, eval framework, and the Stockpilot case study.
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

# AGENT DESIGN PATTERNS
## From Will — Anthropic Applied AI Team

---

## THE CORE PRINCIPLE — HUMAN PRIMITIVES FIRST

Before building any custom tool or complex architecture, ask: **can a human do this with standard tools?**

If yes → use the same tools Claude uses as a human would:
- File system (read, write, navigate)
- Web search
- Code execution (bash, Python)
- Browser navigation
- API calls via curl/requests

**Only build custom tools when standard primitives genuinely cannot solve the problem.**

This keeps agents simpler, more debuggable, and more transferable.

---

## THE THREE BUILDING BLOCKS

### 1. Tools
External capabilities Claude can invoke — APIs, functions, system calls.

```
WHEN TO USE TOOLS:
→ Interacting with external systems (Meta Ads API, WordPress API)
→ Performing calculations or data processing
→ Accessing real-time information (weather, prices, analytics)
→ Writing to or reading from databases

TOOL DESIGN RULE:
One tool = one clear capability.
Never build a "do everything" tool.
Bad:  manage_campaign(action, target, value, ...)
Good: get_campaign_metrics(), pause_campaign(), update_budget()
```

### 2. Skills
Packaged knowledge Claude pulls into context on demand.

```
WHEN TO USE SKILLS:
→ Domain-specific knowledge that doesn't change often
→ Reference data (photo libraries, color codes, style guides)
→ Process instructions for specific task types
→ Historical decisions and project context

SKILL DESIGN RULE:
Skills are read-only knowledge. They don't DO things.
If it takes an action → it's a tool.
If it informs an action → it's a skill.
```

### 3. Sub-agents
Separate Claude instances invoked by a parent Claude to handle specialized tasks.

```
WHEN TO USE SUB-AGENTS:
→ Task requires different context than the parent agent
→ Parallel work streams that are truly independent
→ Specialized expertise that would clutter the main agent's context
→ Tasks that need to run concurrently

SUB-AGENT PATTERN:
Orchestrator Claude → breaks task into subtasks
                    → spawns Sub-agent A (copywriting)
                    → spawns Sub-agent B (image brief)
                    → spawns Sub-agent C (scheduling)
                    → collects outputs → assembles final result
```

---

## THE TOOL VS SKILL DECISION TREE

```
Does it require real-time data or external system access?
  YES → Tool
  NO  ↓

Does it need to take an action in the world?
  YES → Tool
  NO  ↓

Is it knowledge that Claude needs to reference?
  YES → Skill
  NO  ↓

Is it a one-off piece of context for this session only?
  YES → System prompt or inline context
  NO  → Probably doesn't need to be formalized
```

---

## SYSTEM PROMPT ARCHITECTURE

From Will's key insight: **system prompts get bloated over time.** Requirements accumulate, edge cases get added, and suddenly the system prompt is 10,000 tokens of rarely-relevant information.

### The Clean Architecture

```
SYSTEM PROMPT (keep short — max 500 tokens):
- Agent identity and role
- Core behavioral rules (3-5 rules maximum)
- List of available tools (names only)
- Pointer to skills that can be loaded

SKILLS (loaded on demand):
- Domain knowledge (BC campaign, design system, photo library)
- Process instructions
- Reference data

TOOLS (called when needed):
- External API interactions
- File system operations
- Data processing
```

**The test:** If information is needed on less than 70% of tasks → it doesn't belong in the system prompt.

---

## THE STOCKPILOT CASE STUDY (Will's example)

Stockpilot is an e-commerce inventory management agent. The architecture evolution:

**V1 (over-engineered):**
- 40+ custom tools
- Massive system prompt
- Complex orchestration layer
- Brittle, hard to debug

**V2 (simplified with primitives):**
- File system access for inventory data
- Web search for supplier research
- Python execution for calculations
- Only 5 domain-specific tools remained
- System prompt reduced by 80%
- Performance improved

**The lesson:** Complexity in agent architecture almost always reduces performance and increases maintenance cost. Start minimal, add only what data proves necessary.

---

## EVALUATION FRAMEWORK (EVALS)

Agents need evals — automated tests that verify behavior before deploying changes.

### The Three Eval Types

**1. Unit evals** — test individual tool or skill behavior
```
Input: specific scenario
Expected output: defined behavior
Pass/fail: automated
```

**2. Integration evals** — test full agent workflows end-to-end
```
Scenario: "Handle a new BC lead who wants to know about MMA classes"
Expected: correct info, correct tone, correct escalation if needed
Evaluation: human review or reference output comparison
```

**3. Regression evals** — run after any change to ensure nothing broke
```
Run full eval suite before every deployment
If any eval fails → do not deploy
```

### Writing Good Evals

```python
# Good eval: specific, measurable, reproducible
eval_case = {
    "input": "What are the Boxing Center opening hours?",
    "expected_contains": ["10h", "21h15"],
    "expected_tone": "friendly, direct",
    "should_not_contain": ["I don't know", "unable to help"]
}

# Bad eval: vague, subjective, unmeasurable
bad_eval = {
    "input": "Ask about the gym",
    "expected": "A good response"
}
```

---

## AGENT DESIGN FOR BC PROJECT

### Current Session (Manual Agent)
```
Human (you) → Claude (this chat) → Grok/Canva/Tools
                                  ↳ skill loading
                                  ↳ design direction
                                  ↳ prompt generation
```

### Future Workflow (Automated Agent) — Coming Soon
```
Trigger (schedule / event)
  ↓
Orchestrator Claude
  ↓
  ├── Sub-agent: Campaign Monitor (Meta Ads API)
  ├── Sub-agent: Content Generator (BC skills + photos)
  ├── Sub-agent: CRM Trigger (Brevo API)
  └── Sub-agent: Report Generator
  ↓
Human review checkpoint
  ↓
Execution (publish / send / deploy)
```

### Skills for the BC Workflow Agent
```
bc-master        → campaign identity, axes, brief
bc-design        → visual direction
bc-photos        → photo assignments
bc-design-production → tool selection, formats, quality tests
claude-routines  → scheduling, monitoring
agent-design-patterns → this file — architecture decisions
```

---

## THE GOLDEN RULE OF AGENT DESIGN

> "The best agent is the one that does the job with the fewest moving parts."

Every tool, every sub-agent, every layer of orchestration is a potential point of failure. Build simple. Prove it works. Add complexity only when simplicity genuinely cannot do the job.

For BC: one Claude session with the right skills loaded outperforms a complex multi-agent system with the wrong architecture. Skills first, agents later, automation last.
