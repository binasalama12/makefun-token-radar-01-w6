// Patient Capital's board summary: the shape of the whole board in a few numbers.
//
// The dashboard shows these beside the table so a reader can see, at a glance, where the
// board's weight sits: how many rows clear each implied-value band, how the rows split by
// how long their protocols have run with no token, and which categories hold the most rows.
// Everything here is computed from the board's own rows — nothing is hand-written, and no
// protocol name is ever special-cased.

import type { BoardRow } from './model.ts';

/** One bucket of a breakdown: a label and how many rows fall in it. */
export interface SummaryBucket {
  label: string;
  count: number;
}

/** The board, summarised: head, middle, bands, ages and categories. */
export interface BoardSummary {
  /** How many rows the board holds. */
  total: number;
  /** The three strongest rows, by rank. */
  top_three: { rank: number; slug: string; name: string; implied_value_usd: number }[];
  /** The middle row's implied value: half the board sits above it, half below. */
  median_implied_usd: number;
  /** Rows by implied value: over $100M, $10M–$100M, $1M–$10M, under $1M. */
  value_bands: SummaryBucket[];
  /** Rows by age with no token: under a year, 1–2 years, 2–4 years, over 4 years, unknown. */
  age_bands: SummaryBucket[];
  /** The five categories holding the most rows, the rest folded into "Other". */
  top_categories: SummaryBucket[];
}

/** The middle value of a sorted list of whole dollars, or 0 when it is empty. */
export function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/** Count rows into the four implied-value bands, in band order. */
function valueBands(rows: BoardRow[]): SummaryBucket[] {
  const bands: SummaryBucket[] = [
    { label: 'over $100M', count: 0 },
    { label: '$10M – $100M', count: 0 },
    { label: '$1M – $10M', count: 0 },
    { label: 'under $1M', count: 0 },
  ];
  for (const r of rows) {
    const v = r.implied_value_usd;
    if (v >= 100_000_000) bands[0]!.count += 1;
    else if (v >= 10_000_000) bands[1]!.count += 1;
    else if (v >= 1_000_000) bands[2]!.count += 1;
    else bands[3]!.count += 1;
  }
  return bands;
}

/** Count rows into the five age bands, in band order. */
function ageBands(rows: BoardRow[]): SummaryBucket[] {
  const bands: SummaryBucket[] = [
    { label: 'under 1 year', count: 0 },
    { label: '1 – 2 years', count: 0 },
    { label: '2 – 4 years', count: 0 },
    { label: 'over 4 years', count: 0 },
    { label: 'age unknown', count: 0 },
  ];
  for (const r of rows) {
    const age = r.age_days;
    if (age === null) bands[4]!.count += 1;
    else if (age < 365) bands[0]!.count += 1;
    else if (age < 730) bands[1]!.count += 1;
    else if (age < 1460) bands[2]!.count += 1;
    else bands[3]!.count += 1;
  }
  return bands;
}

/** The five categories with the most rows, the rest folded into one "Other" bucket. */
function topCategories(rows: BoardRow[]): SummaryBucket[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.category ?? 'Other';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const top = sorted.slice(0, 5).map(([label, count]) => ({ label, count }));
  const rest = sorted.slice(5).reduce((n, [, c]) => n + c, 0);
  if (rest > 0) top.push({ label: 'Other', count: rest });
  return top;
}

/** The board's summary, from its rows alone. */
export function summarizeBoard(rows: BoardRow[]): BoardSummary {
  return {
    total: rows.length,
    top_three: rows.slice(0, 3).map((r) => ({
      rank: r.rank,
      slug: r.slug,
      name: r.name,
      implied_value_usd: r.implied_value_usd,
    })),
    median_implied_usd: medianOf(rows.map((r) => r.implied_value_usd)),
    value_bands: valueBands(rows),
    age_bands: ageBands(rows),
    top_categories: topCategories(rows),
  };
}

/** The summary as plain lines for the run log: one line per fact. */
export function summaryLines(s: BoardSummary): string[] {
  const top = s.top_three.map((t) => `#${t.rank} ${t.slug}`).join(', ');
  const bands = s.value_bands.map((b) => `${b.label}: ${b.count}`).join(', ');
  const ages = s.age_bands.map((b) => `${b.label}: ${b.count}`).join(', ');
  const cats = s.top_categories.map((b) => `${b.label} ${b.count}`).join(', ');
  return [
    `top three are ${top}`,
    `median implied value is $${s.median_implied_usd.toLocaleString('en-US')}`,
    `value bands — ${bands}`,
    `age bands — ${ages}`,
    `top categories — ${cats}`,
  ];
}
