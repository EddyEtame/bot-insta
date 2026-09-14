---
name: benchmark-optimization-loop
description: Use when the user asks to make something faster, try many variants, run recursive optimization, benchmark latency/throughput/cost, or choose the best implementation by repeated measured tests.
origin: ECC
tools: Read, Write, Edit, Bash, Grep, Glob
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

# Benchmark Optimization Loop

Use this skill to convert "make it 20x faster" or "try 50 recursive
optimizations" into a bounded measured loop that can actually improve a system.

## Required Baseline

Do not optimize until these exist:

- the operation being optimized;
- the correctness gate that must stay green;
- the metric: wall time, p95 latency, rows/sec, cost/run, memory, error rate;
- the current baseline;
- the search budget: max variants, max time, max spend, max data impact.

If the user asks for an unrealistic target, keep the ambition but make the loop
bounded and measurable.

## Loop

1. Measure the baseline.
2. Identify bottlenecks from evidence.
3. Generate variants that test one hypothesis each.
4. Run variants with the same input shape.
5. Reject variants that fail correctness, safety, or reproducibility.
6. Promote the fastest safe variant.
7. Codify the winning path in a script, command, test, config, or doc.
8. Rerun the baseline and winner to confirm the delta.

## Variant Table

Track variants like this:

```text
Variant | Hypothesis | Command | Time | Correct? | Notes
baseline | current path | npm run job | 120s | yes | stable
batch-500 | fewer round trips | npm run job -- --batch 500 | 42s | yes | winner
parallel-8 | more workers | npm run job -- --workers 8 | 31s | no | rate limited
```

## Recursive Search

For recursive or hyperparameter work:

- persist every run to a ledger;
- compare against the prior accepted winner, not only the previous run;
- keep a holdout or replay check;
- stop when improvement is within noise, correctness fails, cost exceeds the
  budget, or the search starts changing more variables than it can explain.

Use phrases like "best measured safe variant" instead of "global optimum" unless
the search space was actually exhaustive.

## Promotion Gate

A variant cannot become the new default until:

- correctness tests pass;
- the performance delta is repeated or explained;
- rollback is obvious;
- the change is encoded in source control or a durable runbook;
- the final summary includes exact commands and measurements.
