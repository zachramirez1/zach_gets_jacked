// All persistence lives in localStorage — works offline, no server needed.
// All weights are in lbs.
import { DEFAULT_GOALS } from "./program";

const KEYS = {
  apiKey: "hevy_api_key",
  weightLog: "weight_log",
  trackedLifts: "tracked_lifts",
  program: "program_state",
} as const;

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface ProgramState {
  trainingMaxes: Record<string, number>; // lift name → TM
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

// Tracked Lifts
const DEFAULT_LIFTS = DEFAULT_GOALS.map((g) => g.lift);
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
