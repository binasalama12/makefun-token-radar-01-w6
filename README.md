# Patient Capital — maturity-weighted token radar

A token launch radar for make.fun's token-radar-01 bounty. It ranks protocols
that record no token by an implied value, and gives each one a seven-step farm
plan built around a long hold of 30–90 days.

## The model

Maturity dominates: the longer a protocol has run with no token, the higher its
implied value. The score follows only from the snapshot's own figures — TVL,
seven-day TVL change, and age since first listing — and no protocol name is
ever special-cased.

```
growth     = clamp(change_7d, -60, 120) per cent (0 when unreported)
growthMult = 1 + (growth / 100) x 0.30
maturity   = 0.5 + 0.5 x min(age_days, 1825) / 1825   (age unknown: 365 days)
implied    = max(1, round(tvl_usd x 0.32 x growthMult x maturity))
```

## The board

160 rows: every one of the 40 watchlist protocols (TVL at or above the $50M
floor, no token on record) plus the 120 pre-token protocols below the floor
with the most TVL. Protocols whose token already trades are never ranked; the
top 24 by market cap are shown separately in the Live token tab with their
market caps, the market's own values.

## The dashboard

A static page with no network: a sortable board (rank, protocol, category,
chains, TVL, 7d change, age, implied value), an age-sorted toggle (oldest
first), text search plus a category filter, and a detail view per protocol
with the model's inputs and its seven-step farm plan. Every farm step states
its cost and its time.

URL views: `?view=board` (default), `?view=detail&slug=<slug>`,
`?view=filtered&f=<text>`.

## How to run it

Node 22 or later, standard library only, no install:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
```

That writes `out/board.json`, `out/data.js`, `out/dashboard/`,
`out/screenshots/` and `out/dossier.json` (written last, via the vendored
`buildDossier`). The program runs twice and writes the same bytes both times:
no clock, no randomness, no network — everything derives from the snapshot.
