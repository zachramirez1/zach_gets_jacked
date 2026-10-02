import { useEffect, useState } from "react";
import { getApiKey } from "./store";

export interface HevyWorkout {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  exercises: HevyExercise[];
}

export interface HevyExercise {
  exercise_template_id: string;
  title: string;
  sets: HevySet[];
}

export interface HevySet {
  type: string;
  weight_kg: number | null;
  reps: number | null;
}

const BASE = "https://api.hevyapp.com";

async function hevyFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "api-key": apiKey, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Hevy API ${res.status}: ${res.statusText}`);
  return res.json();
}

// pageSize max is 10
function getWorkouts(apiKey: string, page: number): Promise<{ workouts: HevyWorkout[]; page_count: number }> {
  return hevyFetch(`/v1/workouts?page=${page}&pageSize=10`, apiKey);
}

async function getAllWorkouts(apiKey: string): Promise<HevyWorkout[]> {
  const first = await getWorkouts(apiKey, 1);
  const pages = first.page_count;
  if (pages <= 1) return first.workouts;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => getWorkouts(apiKey, i + 2))
  );
  return [first.workouts, ...rest.map((r) => r.workouts)].flat();
}

let cache: { key: string; promise: Promise<HevyWorkout[]> } | null = null;

// Fetches once per API key and shares the result across pages
export function useWorkouts() {
  const [state, setState] = useState({ workouts: [] as HevyWorkout[], loading: true, error: "" });
  useEffect(() => {
    const key = getApiKey();
    if (cache?.key !== key) {
      cache = {
        key,
        promise: key ? getAllWorkouts(key) : Promise.reject(new Error("Add your Hevy API key in Settings.")),
      };
    }
    cache.promise
      .then((workouts) => setState({ workouts, loading: false, error: "" }))
      .catch((e: Error) => {
        cache = null;
        setState({ workouts: [], loading: false, error: e.message });
      });
  }, []);
  return state;
}

// Epley 1RM formula: weight * (1 + reps/30)
function calcOneRepMax(weight: number, reps: number): number {
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

// Best estimated 1RM (lbs) per workout date
export function extractOneRepMaxHistory(
  workouts: HevyWorkout[],
  exerciseTitle: string
): { date: string; orm: number }[] {
  const byDate: Record<string, number> = {};
  for (const workout of workouts) {
    const date = workout.start_time.slice(0, 10);
    for (const ex of workout.exercises) {
      if (ex.title.toLowerCase() === exerciseTitle.toLowerCase()) {
        for (const set of ex.sets) {
          if (set.weight_kg && set.reps) {
            const orm = calcOneRepMax(set.weight_kg * 2.20462, set.reps);
            if (!byDate[date] || orm > byDate[date]) byDate[date] = orm;
          }
        }
      }
    }
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, orm]) => ({ date, orm: Math.round(orm) }));
}
