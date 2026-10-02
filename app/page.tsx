"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import Link from "next/link";
import { getApiKey, getWeightLog, getTrackedLifts } from "@/lib/store";
import { getAllWorkouts, extractOneRepMaxHistory, type HevyWorkout } from "@/lib/hevy";
import { DEFAULT_GOALS } from "@/lib/program";

export default function Dashboard() {
  const [workouts, setWorkouts] = useState<HevyWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = getApiKey();
    setHasKey(!!key);
    if (!key) return;
    setLoading(true);
    getAllWorkouts(key)
      .then(setWorkouts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  const weightLog = getWeightLog();
  const trackedLifts = getTrackedLifts();

  const latestWeight = weightLog.at(-1);
  const prevWeight = weightLog.length >= 8 ? weightLog.at(-8) : weightLog.at(0);
  const weightDelta =
    latestWeight && prevWeight && latestWeight.date !== prevWeight.date
      ? ((latestWeight.weight - prevWeight.weight) / prevWeight.weight * 100).toFixed(1)
      : null;

  const orms = trackedLifts.map((lift) => {
    const history = extractOneRepMaxHistory(workouts, lift);
    const latest = history.at(-1);
    const prev = history.length >= 4 ? history.at(-4) : history.at(0);
    const pct =
      latest && prev && latest.date !== prev.date
        ? ((latest.orm - prev.orm) / prev.orm * 100).toFixed(1)
        : null;
    const latestBW = latestWeight?.weight;
    const bwRatio = latest && latestBW ? Math.round((latest.orm / latestBW) * 10) / 10 : null;
    const goalMult = DEFAULT_GOALS.find((g) => g.lift === lift)?.multiplier ?? null;
    const goalPct = latest && latestBW && goalMult
      ? Math.round((latest.orm / (latestBW * goalMult)) * 100)
      : null;
    return { lift, latest, pct, bwRatio, goalPct, goalMult };
  });

  if (!hasKey) {
    return (
      <Shell title="Zach Gets Jacked">
        <div className="flex flex-col items-center justify-center gap-4 pt-16 text-center">
          <div className="text-5xl">🏋️</div>
          <h2 className="text-2xl font-bold">Welcome</h2>
          <p className="text-[#737373] max-w-xs">
            Add your Hevy API key in Settings to start tracking.
          </p>
          <Link
            href="/settings"
            className="mt-2 rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white"
          >
            Add API Key →
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Zach Gets Jacked">
      {/* Body weight */}
      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold text-[#737373] uppercase tracking-widest">Body Weight</h2>
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">
              {latestWeight ? latestWeight.weight : "—"}
              <span className="ml-1 text-sm font-normal text-[#737373]">lbs</span>
            </div>
            <div className="mt-0.5 text-xs text-[#737373]">{latestWeight?.date ?? "No entries yet"}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {weightDelta && (
              <div className={`text-xl font-bold ${parseFloat(weightDelta) <= 0 ? "text-green-400" : "text-orange-400"}`}>
                {parseFloat(weightDelta) > 0 ? "+" : ""}{weightDelta}%
                <div className="text-xs font-normal text-[#737373] text-right">vs earlier</div>
              </div>
            )}
            <Link href="/weight" className="text-xs text-orange-500 font-semibold">Log →</Link>
          </div>
        </Card>
      </section>

      {/* Strength goals */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-[#737373] uppercase tracking-widest">Strength Goals</h2>
          <Link href="/lifts" className="text-xs text-orange-500 font-semibold">Details →</Link>
        </div>
        {loading ? (
          <div className="text-[#737373] text-sm py-6 text-center">Loading from Hevy...</div>
        ) : error ? (
          <Card><div className="text-red-400 text-sm">{error}</div></Card>
        ) : (
          <div className="flex flex-col gap-3">
            {orms.map(({ lift, latest, pct, bwRatio, goalPct, goalMult }) => (
              <Card key={lift}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{lift.replace(" (Barbell)", "")}</div>
                    <div className="text-xs text-[#737373]">
                      {latest ? latest.orm : "—"} lbs est. 1RM
                      {bwRatio !== null && <span className="ml-2 text-orange-400">{bwRatio}× BW</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {goalPct !== null && (
                      <div className={`text-lg font-bold ${goalPct >= 100 ? "text-green-400" : "text-orange-400"}`}>
                        {goalPct}%
                        {goalPct >= 100 && <span className="ml-1 text-sm">✓</span>}
                      </div>
                    )}
                    {pct && (
                      <div className={`text-xs ${parseFloat(pct) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {parseFloat(pct) > 0 ? "+" : ""}{pct}% recent
                      </div>
                    )}
                  </div>
                </div>
                {/* Goal progress bar */}
                {goalPct !== null && goalMult !== null && (
                  <div>
                    <div className="h-1.5 w-full rounded-full bg-[#262626] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${goalPct >= 100 ? "bg-green-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.min(goalPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-[#737373]">0</span>
                      <span className="text-xs text-[#737373]">Goal: {goalMult}× BW</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
