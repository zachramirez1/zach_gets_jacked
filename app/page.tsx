"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import Card, { Label } from "@/components/Card";
import { getWeek, setWeek } from "@/lib/store";
import { useWorkouts, extractOneRepMaxHistory } from "@/lib/hevy";
import { LIFTS, CYCLES, nextWeek, prescribedSets, trainingMax } from "@/lib/program";

export default function Today() {
  const [week, setWeekState] = useState(getWeek);
  const { workouts, loading, error } = useWorkouts();
  const cycle = CYCLES[week.weekIndex];
  const status = loading ? "Loading from Hevy..." : error;

  function advance() {
    const next = nextWeek(week);
    setWeek(next);
    setWeekState(next);
  }

  return (
    <Shell title="Today">
      <Card className="mb-4 flex items-center justify-between">
        <div>
          <Label>Cycle {week.cycleNumber}</Label>
          <div className="text-xl font-bold text-orange-500">{cycle.label}</div>
          <div className="mt-1 text-xs text-muted">+ sets are AMRAP — as many reps as possible</div>
        </div>
        <div className="ml-3 flex shrink-0 flex-col items-end gap-2">
          <button onClick={advance} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white">
            Next Week →
          </button>
          <div className="flex gap-1">
            {CYCLES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${
                  i === week.weekIndex ? "bg-orange-500" : i < week.weekIndex ? "bg-orange-500/40" : "bg-line"
                }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {status ? (
        <Card className="text-sm text-muted">{status}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {LIFTS.map((lift) => {
            const orm = extractOneRepMaxHistory(workouts, lift.name).at(-1)?.orm;
            if (!orm) {
              return (
                <Card key={lift.name} className="text-sm text-muted">
                  No &quot;{lift.name}&quot; sets found in Hevy.
                </Card>
              );
            }
            const tm = trainingMax(orm);
            const sets = prescribedSets(tm, week.weekIndex);
            return (
              <Card key={lift.name}>
                <div className="mb-3">
                  <div className="font-semibold">{lift.short}</div>
                  <div className="text-xs text-muted">TM {tm} lbs · 90% of {orm} est. 1RM</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {sets.map((s, i) => {
                    const top = i === sets.length - 1;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-center ${
                          top ? "border-orange-500/30 bg-orange-500/10 text-orange-400" : "border-line bg-bg"
                        }`}
                      >
                        <div className="text-lg font-bold">{s.weight}</div>
                        <div className="text-xs text-muted">lbs</div>
                        <div className="mt-1 text-sm font-semibold">{s.reps} reps</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
