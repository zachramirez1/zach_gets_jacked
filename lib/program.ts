import type { Week } from "./store";

// Goal = target 1RM as a multiple of bodyweight
export const LIFTS = [
  { name: "Bench Press (Barbell)", short: "Bench Press", goal: 1.0 },
  { name: "Overhead Press (Barbell)", short: "Overhead Press", goal: 0.65 },
  { name: "Squat (Barbell)", short: "Squat", goal: 1.25 },
  { name: "Deadlift (Barbell)", short: "Deadlift", goal: 1.5 },
];

// 5/3/1 — the "+" sets are AMRAP (as many reps as possible)
export const CYCLES = [
  { label: "Week 1 · 5/5/5+", sets: [{ reps: "5", pct: 0.65 }, { reps: "5", pct: 0.75 }, { reps: "5+", pct: 0.85 }] },
  { label: "Week 2 · 3/3/3+", sets: [{ reps: "3", pct: 0.70 }, { reps: "3", pct: 0.80 }, { reps: "3+", pct: 0.90 }] },
  { label: "Week 3 · 5/3/1+", sets: [{ reps: "5", pct: 0.75 }, { reps: "3", pct: 0.85 }, { reps: "1+", pct: 0.95 }] },
  { label: "Week 4 · Deload", sets: [{ reps: "5", pct: 0.40 }, { reps: "5", pct: 0.50 }, { reps: "5", pct: 0.60 }] },
];

// Round to nearest 5 lbs (standard plate math)
function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

// Training max is 90% of the latest est. 1RM, so AMRAP sets drive progression
export function trainingMax(orm: number): number {
  return roundTo5(orm * 0.9);
}

export function prescribedSets(tm: number, weekIndex: number) {
  return CYCLES[weekIndex].sets.map((s) => ({ reps: s.reps, weight: roundTo5(tm * s.pct) }));
}

export function nextWeek({ weekIndex, cycleNumber }: Week): Week {
  const next = (weekIndex + 1) % CYCLES.length;
  return { weekIndex: next, cycleNumber: next === 0 ? cycleNumber + 1 : cycleNumber };
}
