import type { WeightEntry } from "./store";

export interface LiftGoal {
  lift: string;
  multiplier: number; // target 1RM as multiple of bodyweight
}

export const DEFAULT_GOALS: LiftGoal[] = [
  { lift: "Bench Press (Barbell)", multiplier: 1.0 },
  { lift: "Overhead Press (Barbell)", multiplier: 0.65 },
  { lift: "Squat (Barbell)", multiplier: 1.25 },
  { lift: "Deadlift (Barbell)", multiplier: 1.5 },
];

// 5/3/1 — the "+" sets are AMRAP (as many reps as possible)
export const CYCLES = [
  {
    label: "Week 1 · 5/5/5+",
    sets: [
      { reps: "5", pct: 0.65 },
      { reps: "5", pct: 0.75 },
      { reps: "5+", pct: 0.85 },
    ],
  },
  {
    label: "Week 2 · 3/3/3+",
    sets: [
      { reps: "3", pct: 0.70 },
      { reps: "3", pct: 0.80 },
      { reps: "3+", pct: 0.90 },
    ],
  },
  {
    label: "Week 3 · 5/3/1+",
    sets: [
      { reps: "5", pct: 0.75 },
      { reps: "3", pct: 0.85 },
      { reps: "1+", pct: 0.95 },
    ],
  },
  {
    label: "Week 4 · Deload",
    sets: [
      { reps: "5", pct: 0.40 },
      { reps: "5", pct: 0.50 },
      { reps: "5", pct: 0.60 },
    ],
  },
];

// Round to nearest 5 lbs (standard plate math)
export function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function prescribedSets(tm: number, weekIndex: number) {
  return CYCLES[weekIndex].sets.map((s) => ({
    reps: s.reps,
    weight: roundTo5(tm * s.pct),
  }));
}

// After completing the 3-week wave, TM increases:
// upper body lifts: +5 lbs, lower body: +10 lbs
export function isUpperBody(lift: string): boolean {
  const l = lift.toLowerCase();
  return l.includes("bench") || l.includes("overhead") || l.includes("press") || l.includes("curl");
}

export function tmIncrement(lift: string): number {
  return isUpperBody(lift) ? 5 : 10;
}

// Given a date and the bodyweight log, return the nearest bodyweight value.
// Interpolates linearly between the two closest entries.
export function interpolateBW(date: string, log: WeightEntry[]): number | null {
  if (log.length === 0) return null;
  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));
  if (date <= sorted[0].date) return sorted[0].weight;
  if (date >= sorted[sorted.length - 1].date) return sorted[sorted.length - 1].weight;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (date >= sorted[i].date && date <= sorted[i + 1].date) {
      const t0 = new Date(sorted[i].date).getTime();
      const t1 = new Date(sorted[i + 1].date).getTime();
      const t = new Date(date).getTime();
      const frac = (t - t0) / (t1 - t0);
      return sorted[i].weight + frac * (sorted[i + 1].weight - sorted[i].weight);
    }
  }
  return sorted[sorted.length - 1].weight;
}

// Build a chart series: lift 1RM as % of goal (e.g. 100% = hit the target)
export function goalProgressSeries(
  ormHistory: { date: string; orm: number; ormLbs: number }[],
  goalMultiplier: number,
  weightLog: WeightEntry[],
  units: string
): { date: string; pct: number; bwRatio: number }[] {
  return ormHistory
    .map((h) => {
      const bw = interpolateBW(h.date, weightLog);
      if (!bw) return null;
      const ormInUnits = units === "lbs" ? h.ormLbs : h.orm;
      const target = goalMultiplier * bw;
      const pct = Math.round((ormInUnits / target) * 100);
      const bwRatio = Math.round((ormInUnits / bw) * 100) / 100;
      return { date: h.date.slice(5), pct, bwRatio };
    })
    .filter((x): x is { date: string; pct: number; bwRatio: number } => x !== null);
}
