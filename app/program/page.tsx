"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import {
  getTrackedLifts, getUnits, getProgramState, setProgramState, advanceWeek,
  getWeightLog, getApiKey, type ProgramState,
} from "@/lib/store";
import { getAllWorkouts, extractOneRepMaxHistory } from "@/lib/hevy";
import { CYCLES, prescribedSets, tmIncrement, DEFAULT_GOALS } from "@/lib/program";

export default function ProgramPage() {
  const [state, setState] = useState<ProgramState>({ trainingMaxes: {}, weekIndex: 0, cycleNumber: 1 });
  const [lifts, setLifts] = useState<string[]>([]);
  const [units, setUnits] = useState("lbs");
  const [editingTMs, setEditingTMs] = useState(false);
  const [tmInputs, setTmInputs] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [loadingOrm, setLoadingOrm] = useState(false);
  const [apiKey, setApiKeyState] = useState("");

  useEffect(() => {
    setMounted(true);
    const s = getProgramState();
    const l = getTrackedLifts();
    const u = getUnits();
    setState(s);
    setLifts(l);
    setUnits(u);
    setApiKeyState(getApiKey());
    setTmInputs(
      Object.fromEntries(l.map((lift) => [lift, String(s.trainingMaxes[lift] ?? "")]))
    );
  }, []);

  if (!mounted) return null;

  const cycle = CYCLES[state.weekIndex];
  const weightLog = getWeightLog();
  const latestBW = weightLog.at(-1)?.weight ?? null;

  const goals = DEFAULT_GOALS;
  const goalFor = (lift: string) => goals.find((g) => g.lift === lift)?.multiplier ?? null;

  function saveTMs() {
    const newTMs: Record<string, number> = {};
    for (const lift of lifts) {
      const v = parseFloat(tmInputs[lift]);
      if (!isNaN(v) && v > 0) newTMs[lift] = v;
    }
    const next = { ...state, trainingMaxes: newTMs };
    setProgramState(next);
    setState(next);
    setEditingTMs(false);
  }

  async function autoFillFromHevy() {
    const key = apiKey;
    if (!key) return;
    setLoadingOrm(true);
    try {
      const workouts = await getAllWorkouts(key);
      const newInputs = { ...tmInputs };
      for (const lift of lifts) {
        const history = extractOneRepMaxHistory(workouts, lift);
        const latest = history.at(-1);
        if (latest) {
          const orm = units === "lbs" ? latest.ormLbs : latest.orm;
          // TM = 90% of 1RM, rounded to nearest 5
          newInputs[lift] = String(Math.round((orm * 0.9) / 5) * 5);
        }
      }
      setTmInputs(newInputs);
    } finally {
      setLoadingOrm(false);
    }
  }

  function doAdvanceWeek() {
    const next = advanceWeek(state, lifts);
    setProgramState(next);
    setState(next);
  }

  const hasTMs = lifts.some((l) => state.trainingMaxes[l]);

  return (
    <Shell title="5/3/1 Program">
      {/* Cycle header */}
      <Card className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-[#737373] font-semibold uppercase tracking-widest mb-1">
            Cycle {state.cycleNumber}
          </div>
          <div className="text-xl font-bold text-orange-500">{cycle.label}</div>
          <div className="text-xs text-[#737373] mt-1">
            + sets are AMRAP — push for as many reps as possible
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0 ml-3">
          <button
            onClick={doAdvanceWeek}
            disabled={!hasTMs}
            className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-30"
          >
            Next Week →
          </button>
          <div className="flex gap-1">
            {CYCLES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === state.weekIndex ? "bg-orange-500" : i < state.weekIndex ? "bg-orange-500/40" : "bg-[#262626]"
                }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Training maxes */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-[#737373] font-semibold uppercase tracking-widest">
          Training Maxes ({units})
        </div>
        <div className="flex gap-3">
          {editingTMs ? (
            <>
              <button onClick={autoFillFromHevy} disabled={loadingOrm} className="text-xs text-[#737373] font-semibold">
                {loadingOrm ? "Loading..." : "Auto from Hevy"}
              </button>
              <button onClick={saveTMs} className="text-xs text-orange-500 font-bold">Save</button>
              <button onClick={() => setEditingTMs(false)} className="text-xs text-[#737373]">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditingTMs(true)} className="text-xs text-orange-500 font-semibold">Edit</button>
          )}
        </div>
      </div>

      {!hasTMs && !editingTMs && (
        <Card className="mb-4">
          <p className="text-sm text-[#737373] mb-3">
            Set your training maxes to see prescribed weights. TM = 90% of your 1RM.
          </p>
          <button
            onClick={() => setEditingTMs(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Set Training Maxes
          </button>
        </Card>
      )}

      {editingTMs && (
        <Card className="mb-4">
          <p className="text-xs text-[#737373] mb-3">
            Enter TM = 90% of your 1RM, or tap &quot;Auto from Hevy&quot; to calculate from your workout history.
          </p>
          {lifts.map((lift) => (
            <div key={lift} className="flex items-center gap-3 mb-2">
              <label className="text-sm flex-1 truncate">{lift.replace(" (Barbell)", "")}</label>
              <input
                type="number"
                inputMode="decimal"
                value={tmInputs[lift] ?? ""}
                onChange={(e) => setTmInputs({ ...tmInputs, [lift]: e.target.value })}
                placeholder={units}
                className="w-24 rounded-lg bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-[#f5f5f5] text-right"
              />
            </div>
          ))}
        </Card>
      )}

      {/* Prescribed sets for each lift */}
      {hasTMs && (
        <div className="flex flex-col gap-3 mb-4">
          {lifts.map((lift) => {
            const tm = state.trainingMaxes[lift];
            if (!tm) return null;
            const sets = prescribedSets(tm, state.weekIndex);
            const mult = goalFor(lift);
            const currentRatioDisplay = latestBW && mult
              ? `Goal: ${mult}× BW`
              : null;
            const inc = tmIncrement(lift);

            return (
              <Card key={lift}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold">{lift.replace(" (Barbell)", "")}</div>
                    <div className="text-xs text-[#737373]">
                      TM: {tm} {units}
                      {currentRatioDisplay && <span className="ml-2">{currentRatioDisplay}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-[#737373] text-right shrink-0 ml-2">
                    Next cycle<br />+{inc} {units}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {sets.map((s, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-center ${
                        i === sets.length - 1
                          ? "bg-orange-500/10 border border-orange-500/30"
                          : "bg-[#0a0a0a] border border-[#262626]"
                      }`}
                    >
                      <div className={`text-lg font-bold ${i === sets.length - 1 ? "text-orange-400" : ""}`}>
                        {s.weight}
                      </div>
                      <div className="text-xs text-[#737373]">{units}</div>
                      <div className={`text-sm font-semibold mt-1 ${i === sets.length - 1 ? "text-orange-400" : "text-[#f5f5f5]"}`}>
                        {s.reps} reps
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bodyweight goal targets */}
      {latestBW && (
        <>
          <div className="text-xs text-[#737373] font-semibold uppercase tracking-widest mb-2">
            Strength Goals at {latestBW} {units} BW
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_GOALS.map(({ lift, multiplier }) => {
              const target = Math.round(latestBW * multiplier);
              const tm = state.trainingMaxes[lift];
              const est1rm = tm ? Math.round(tm / 0.9) : null;
              const pct = est1rm ? Math.round((est1rm / target) * 100) : null;
              return (
                <Card key={lift}>
                  <div className="text-xs text-[#737373] truncate mb-1 leading-tight">
                    {lift.replace(" (Barbell)", "")}
                  </div>
                  <div className="text-lg font-bold">
                    {target} <span className="text-xs font-normal text-[#737373]">{units}</span>
                  </div>
                  <div className="text-xs text-[#737373] mb-2">{multiplier}× bodyweight</div>
                  {pct !== null && (
                    <>
                      <div className="h-1.5 w-full rounded-full bg-[#262626] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange-500 transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className={`text-xs mt-1 font-semibold ${pct >= 100 ? "text-green-400" : "text-orange-400"}`}>
                        {pct}% {pct >= 100 ? "✓ Goal reached!" : "of goal"}
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}
