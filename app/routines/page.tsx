"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import { getApiKey } from "@/lib/store";
import { getRoutines, type HevyRoutine } from "@/lib/hevy";

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<HevyRoutine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = getApiKey();
    if (!key) return;
    setLoading(true);
    getRoutines(key)
      .then((r) => setRoutines(r.routines))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  const key = getApiKey();
  if (!key) {
    return (
      <Shell title="Workout Plans">
        <Card>
          <div className="text-[#737373] text-sm">Add your Hevy API key in Settings to see your routines.</div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title="Workout Plans">
      {loading && <div className="text-[#737373] text-sm py-8 text-center">Loading routines...</div>}
      {error && <Card><div className="text-red-400 text-sm">{error}</div></Card>}
      {!loading && !error && routines.length === 0 && (
        <Card><div className="text-[#737373] text-sm">No routines found in Hevy.</div></Card>
      )}
      <div className="flex flex-col gap-3">
        {routines.map((r) => (
          <div key={r.id}>
            <button
              className="w-full text-left"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            >
              <Card className={`transition-colors ${expanded === r.id ? "border-orange-500/50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-[#737373] mt-0.5">{r.exercises.length} exercises</div>
                  </div>
                  <div className={`text-orange-500 text-lg transition-transform ${expanded === r.id ? "rotate-90" : ""}`}>›</div>
                </div>
              </Card>
            </button>

            {expanded === r.id && (
              <div className="mt-2 ml-2 flex flex-col gap-2">
                {r.exercises.map((ex, i) => {
                  const workSets = ex.sets.filter((s) => s.type === "normal" || s.type === "working");
                  return (
                    <Card key={i} className="py-3">
                      <div className="font-medium text-sm">{ex.title}</div>
                      <div className="text-xs text-[#737373] mt-1">
                        {ex.sets.length} sets
                        {workSets[0]?.reps ? ` · ${workSets[0].reps} reps` : ""}
                        {workSets[0]?.weight_kg ? ` · ${Math.round(workSets[0].weight_kg * 2.20462)} lbs` : ""}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}
