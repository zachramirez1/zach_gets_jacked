// All persistence lives in localStorage. All weights are lbs.
// Reads are wrapped in try because pages also render once on the server, where localStorage doesn't exist.

const KEYS = {
  apiKey: "hevy_api_key",
  weightLog: "weight_log",
  week: "program_state",
} as const;

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface Week {
  weekIndex: number; // 0=week1, 1=week2, 2=week3, 3=deload
  cycleNumber: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEYS.apiKey) ?? "";
  } catch {
    return "";
  }
}
export function setApiKey(key: string) {
  localStorage.setItem(KEYS.apiKey, key.trim());
}

export function getWeightLog(): WeightEntry[] {
  return read(KEYS.weightLog, []);
}
export function setWeightLog(log: WeightEntry[]) {
  localStorage.setItem(KEYS.weightLog, JSON.stringify(log));
}

export function getWeek(): Week {
  const { weekIndex, cycleNumber } = read(KEYS.week, { weekIndex: 0, cycleNumber: 1 });
  return { weekIndex, cycleNumber };
}
export function setWeek(week: Week) {
  localStorage.setItem(KEYS.week, JSON.stringify(week));
}
