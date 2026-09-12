// All persistence lives in localStorage — works offline, no server needed.

const KEYS = {
  apiKey: "hevy_api_key",
  weightLog: "weight_log",
  trackedLifts: "tracked_lifts",
  units: "units",
  program: "program_state",
} as const;

export type Units = "lbs" | "kg";

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number; // in user's chosen unit
}

export interface ProgramState {
  trainingMaxes: Record<string, number>; // lift name → TM in user's units
  weekIndex: number;  // 0=week1, 1=week2, 2=week3, 3=deload
  cycleNumber: number;
}

// API Key
export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEYS.apiKey) ?? "";
}
export function setApiKey(key: string) {
  localStorage.setItem(KEYS.apiKey, key.trim());
}

// Units
export function getUnits(): Units {
  if (typeof window === "undefined") return "lbs";
  return (localStorage.getItem(KEYS.units) as Units) ?? "lbs";
}
export function setUnits(u: Units) {
  localStorage.setItem(KEYS.units, u);
}

// Weight Log
export function getWeightLog(): WeightEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.weightLog) ?? "[]");
  } catch {
    return [];
  }
}
export function addWeightEntry(entry: WeightEntry) {
  const log = getWeightLog().filter((e) => e.date !== entry.date);
  log.push(entry);
  log.sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(KEYS.weightLog, JSON.stringify(log));
}
export function deleteWeightEntry(date: string) {
  const log = getWeightLog().filter((e) => e.date !== date);
  localStorage.setItem(KEYS.weightLog, JSON.stringify(log));
}

// Tracked Lifts (the 4 main lifts)
const DEFAULT_LIFTS = [
  "Bench Press (Barbell)",
  "Overhead Press (Barbell)",
  "Squat (Barbell)",
  "Deadlift (Barbell)",
];
export function getTrackedLifts(): string[] {
  if (typeof window === "undefined") return DEFAULT_LIFTS;
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.trackedLifts) ?? "null");
    return stored ?? DEFAULT_LIFTS;
  } catch {
    return DEFAULT_LIFTS;
  }
}
export function setTrackedLifts(lifts: string[]) {
  localStorage.setItem(KEYS.trackedLifts, JSON.stringify(lifts));
}

// 5/3/1 Program State
const DEFAULT_PROGRAM: ProgramState = {
  trainingMaxes: {},
  weekIndex: 0,
  cycleNumber: 1,
};
export function getProgramState(): ProgramState {
  if (typeof window === "undefined") return DEFAULT_PROGRAM;
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.program) ?? "null");
    return stored ?? DEFAULT_PROGRAM;
  } catch {
    return DEFAULT_PROGRAM;
  }
}
export function setProgramState(state: ProgramState) {
  localStorage.setItem(KEYS.program, JSON.stringify(state));
}
export function advanceWeek(state: ProgramState, lifts: string[]): ProgramState {
  const nextWeek = (state.weekIndex + 1) % 4;
  // After completing week 3 (index 2) or week 4 deload (index 3), bump TMs
  const shouldBump = state.weekIndex === 2; // completed the main wave
  const newTMs = { ...state.trainingMaxes };
  if (shouldBump) {
    for (const lift of lifts) {
      if (newTMs[lift]) {
        const inc = lift.toLowerCase().includes("squat") || lift.toLowerCase().includes("deadlift") ? 10 : 5;
        newTMs[lift] = newTMs[lift] + inc;
      }
    }
  }
  return {
    trainingMaxes: newTMs,
    weekIndex: nextWeek,
    cycleNumber: nextWeek === 0 ? state.cycleNumber + 1 : state.cycleNumber,
  };
}
