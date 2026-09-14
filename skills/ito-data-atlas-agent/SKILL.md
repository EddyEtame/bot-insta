---
name: ito-data-atlas-agent
description: Design background Data Atlas style agents for Itô basket research, market discovery, parameter drafting, and human-in-the-loop editing. Use for architecture and workflow planning, not live order execution.
origin: ECC
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

# Itô Data Atlas Agent

Use this skill to design an agent that watches data sources, builds candidate
prediction-market baskets, drafts parameter changes, and hands the result to a
human for review.

This skill describes architecture and workflow. It does not run live trading.

## Guardrails

- Keep all execution behind explicit human approval.
- Require `ITO_API_KEY` only for read-only Itô data access unless a separate
  private implementation explicitly adds execution controls.
- Do not persist private user data unless the target repo already has a storage
  contract and the user asks for it.
- Do not expose private strategy logic, venue credentials, or local paths in
  public docs.

## Architecture Pattern

Use four lanes:

1. Research collector: public web, X, GitHub, venue docs, API metadata, and
   Itô read endpoints when gated access exists.
2. Basket drafter: turns sources into candidate underliers, weights, rules, and
   questions.
3. Risk reviewer: checks data freshness, venue limits, resolution ambiguity,
   compliance notes, and prompt-injection exposure.
4. Human editor: opens a chat or UI state where the user can approve, reject,
   adjust, or ask for more research.

## Workflow

1. Define the user objective and excluded actions.
2. List data sources and access requirements.
3. Draft a basket spec with provenance for every underlier.
4. Produce editable parameters rather than executable orders.
5. Store an audit trail: inputs, model output, sources, and human decision.

## Useful Skill Chains

- `deep-research` for source collection.
- `x-api` for current social/event signal.
- `ito-market-intelligence` for venue and underlier context.
- `ito-basket-compare` for user knowledge-base matching.
- `prediction-market-risk-review` before any execution-capable integration.

## Output Contract

Return an implementation-ready workflow spec with:

- data sources
- access gates
- agent roles
- human approval points
- storage/audit boundary
- non-goals
