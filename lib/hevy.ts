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

export interface HevyRoutine {
  id: string;
  title: string;
  exercises: HevyRoutineExercise[];
  updated_at: string;
}

export interface HevyRoutineExercise {
  exercise_template_id: string;
  title: string;
  sets: { type: string; weight_kg: number | null; reps: number | null }[];
}

export interface HevyExerciseTemplate {
  id: string;
  title: string;
  type: string;
  muscle_group: string;
}

const BASE = "https://api.hevyapp.com";

async function hevyFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "api-key": apiKey, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Hevy API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getWorkouts(apiKey: string, page = 1, pageSize = 10): Promise<{ workouts: HevyWorkout[]; page_count: number }> {
  return hevyFetch(`/v1/workouts?page=${page}&pageSize=${pageSize}`, apiKey);
}

export async function getAllWorkouts(apiKey: string): Promise<HevyWorkout[]> {
  const first = await getWorkouts(apiKey, 1, 20);
  const pages = first.page_count;
  if (pages <= 1) return first.workouts;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => getWorkouts(apiKey, i + 2, 20))
  );
  return [first.workouts, ...rest.map((r) => r.workouts)].flat();
}

export async function getRoutines(apiKey: string): Promise<{ routines: HevyRoutine[] }> {
  return hevyFetch("/v1/routines?page=1&pageSize=50", apiKey);
}

export async function getExerciseHistory(apiKey: string, exerciseId: string): Promise<{ exercises: { sets: HevySet[]; workout_id: string; start_time: string }[] }> {
  return hevyFetch(`/v1/exercise_templates/${exerciseId}/history?page=1&pageSize=100`, apiKey);
}

// Epley 1RM formula: weight * (1 + reps/30)
export function calcOneRepMax(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100;
}

// Extract best 1RM per workout date from exercise history
export function extractOneRepMaxHistory(
  workouts: HevyWorkout[],
  exerciseTitle: string
): { date: string; orm: number; ormLbs: number }[] {
  const byDate: Record<string, number> = {};
  for (const workout of workouts) {
    const date = workout.start_time.slice(0, 10);
    for (const ex of workout.exercises) {
      if (ex.title.toLowerCase() === exerciseTitle.toLowerCase()) {
        for (const set of ex.sets) {
          if (set.weight_kg && set.reps) {
            const orm = calcOneRepMax(set.weight_kg, set.reps);
            if (!byDate[date] || orm > byDate[date]) byDate[date] = orm;
          }
        }
      }
    }
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, orm]) => ({ date, orm, ormLbs: kgToLbs(orm) }));
}
