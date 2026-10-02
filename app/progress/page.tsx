"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import Card, { Label } from "@/components/Card";
import TrendChart from "@/components/TrendChart";
import { getWeightLog, setWeightLog } from "@/lib/store";
import { useWorkouts, extractOneRepMaxHistory } from "@/lib/hevy";
import { LIFTS } from "@/lib/program";

const today = () => new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD

export default function Progress() {
  const [log, setLog] = useState(getWeightLog);
  const [date, setDate] = useState(today);
  const [input, setInput] = useState("");
  const { workouts, loading, error } = useWorkouts();
  const status = loading ? "Loading from Hevy..." : error;

  function save(next: typeof log) {
    setWeightLog(next);
    setLog(next);
  }

  function add() {
    const weight = parseFloat(input);
    if (!weight || weight < 50 || weight > 500) return;
    save([...log.filter((e) => e.date !== date), { date, weight }].sort((a, b) => a.date.localeCompare(b.date)));
    setInput("");
  }

  const latest = log.at(-1);
  const weekAgo = log.at(-8) ?? log.at(0);
  const delta = latest && weekAgo && latest !== weekAgo ? latest.weight - weekAgo.weight : null;
  const bw = latest?.weight;

  return (
    <Shell title="Progress">
      <Label>Body Weight</Label>
      <Card className="mb-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="text-3xl font-bold">
            {bw ?? "—"} <span className="text-sm font-normal text-muted">lbs</span>
          </div>
          {delta !== null && (
            <div className={`font-bold ${delta <= 0 ? "text-green-400" : "text-orange-400"}`}>
              {delta > 0 ? "+" : ""}{delta.toFixed(1)} <span className="text-xs font-normal text-muted">vs earlier</span>
            </div>
          )}
        </div>

        {log.length >= 2 && (
          <TrendChart label="Weight" data={log.slice(-30).map((e) => ({ date: e.date.slice(5), value: e.weight }))} />
        )}

        <div className="mt-3 flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="lbs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="w-20 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <button onClick={add} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
            Add
          </button>
        </div>

        {log.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-xs text-muted">All entries ({log.length})</summary>
            {[...log].reverse().map((e) => (
              <div key={e.date} className="flex items-center justify-between border-b border-line py-2">
                <span>
                  {e.weight} lbs <span className="ml-2 text-xs text-muted">{e.date}</span>
                </span>
                <button
                  onClick={() => save(log.filter((x) => x.date !== e.date))}
                  className="px-2 text-lg text-muted"
                  aria-label="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </details>
        )}
      </Card>

      <Label>Strength Goals</Label>
      {status ? (
        <Card className="text-sm text-muted">{status}</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {LIFTS.map((lift) => {
            const history = extractOneRepMaxHistory(workouts, lift.name);
            const orm = history.at(-1)?.orm;
            const goalPct = orm && bw ? Math.round((orm / (bw * lift.goal)) * 100) : null;
            return (
              <Card key={lift.name}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{lift.short}</div>
                    <div className="text-xs text-muted">
                      {orm ?? "—"} lbs est. 1RM
                      {orm && bw && <span className="ml-2 text-orange-400">{(orm / bw).toFixed(1)}× BW</span>}
                    </div>
                  </div>
                  {goalPct !== null && (
                    <div className={`text-lg font-bold ${goalPct >= 100 ? "text-green-400" : "text-orange-400"}`}>
                      {goalPct}%{goalPct >= 100 && " ✓"}
                    </div>
                  )}
                </div>
                {goalPct !== null && (
                  <>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className={`h-full rounded-full ${goalPct >= 100 ? "bg-green-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.min(goalPct, 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-muted">Goal: {lift.goal}× BW</div>
                  </>
                )}
                {history.length >= 2 && (
                  <TrendChart
                    label="Est. 1RM"
                    height={100}
                    data={history.slice(-20).map((h) => ({ date: h.date.slice(5), value: h.orm }))}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
