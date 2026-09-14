---
name: ito-basket-compare
description: Compare Itô prediction-market baskets against a user's knowledge base, portfolio notes, financial context, watchlist, or research thesis. Use for read-only basket comparison and gap analysis without investment advice or live trading.
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

# Itô Basket Compare

Use this skill to compare a basket, theme, or market set against a user's
knowledge base, portfolio notes, research memo, CRM context, or stated thesis.

This skill is read-only. It does not recommend trades. It helps a user inspect
fit, exposure, assumptions, and missing context before they decide what to do.

## Guardrails

- Do not provide investment advice or tell the user to buy, sell, hold, hedge,
  lever, or size a trade.
- Do not execute, prepare, or submit orders.
- Do not use private documents unless the user explicitly points to them.
- Use `ITO_API_KEY` only for read-only Itô basket/market data after explicit
  user request.
- If comparing against financials, preserve privacy and summarize only the
  fields needed for the comparison.

## Comparison Modes

### Basket vs Knowledge Base

1. Identify the basket theme and underliers.
2. Retrieve the user's relevant notes, docs, or memory snippets.
3. Map each underlier to claims, sources, uncertainties, and stale assumptions.
4. Return aligned signals, conflicting signals, and missing research.

### Basket vs Portfolio Notes

1. Parse the user's watchlist, holdings summary, or exposure notes.
2. Compare themes, geographies, time horizons, and event outcomes.
3. Flag concentration, correlation, and duplicated narrative exposure.
4. Avoid recommendations; phrase output as inspection and questions.

### Basket vs Financial Context

1. Accept only user-provided or explicitly selected financial context.
2. Identify liquidity, drawdown, time-horizon, and constraint mismatches.
3. Ask for missing constraints instead of guessing.

## Output Contract

Use this structure:

1. Basket summary
2. Comparison target
3. Matches
4. Conflicts or stale assumptions
5. Missing context
6. User-action checklist

End with:

```text
This comparison is informational and not investment or trading advice.
```
