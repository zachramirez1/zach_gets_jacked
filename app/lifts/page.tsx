"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import { getApiKey, getTrackedLifts, getWeightLog } from "@/lib/store";
import { getAllWorkouts, extractOneRepMaxHistory, type HevyWorkout } from "@/lib/hevy";
import { interpolateBW } from "@/lib/program";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function LiftsPage() {
  const [workouts, setWorkouts] = useState<HevyWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackedLifts, setLifts] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLifts(getTrackedLifts());
    const key = getApiKey();
    if (!key) return;
    setLoading(true);
    getAllWorkouts(key)
      .then(setWorkouts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  const weightLog = getWeightLog();
  const lift = trackedLifts[selected] ?? "";
  const history = extractOneRepMaxHistory(workouts, lift);
  const latest = history.at(-1);
  const first = history.at(0);

  const bwRatio = (h: { date: string; orm: number }) => {
    const bw = interpolateBW(h.date, weightLog);
    return bw ? Math.round((h.orm / bw) * 10) / 10 : null;
  };
  const latestBWRatio = latest ? bwRatio(latest) : null;

  const totalPct =
    latest && first && latest.date !== first.date
      ? ((latest.orm - first.orm) / first.orm * 100).toFixed(1)
      : null;

  const chartData = history.slice(-20).map((h) => ({ date: h.date.slice(5), orm: h.orm }));

  return (
    <Shell title="1RM Tracker">
      {/* Lift selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {trackedLifts.map((l, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              selected === i
                ? "bg-orange-500 text-white"
                : "bg-[#141414] text-[#737373] border border-[#262626]"
            }`}
          >
            {l.replace(" (Barbell)", "").replace(" (Dumbbell)", "")}
          </button>
        ))}
      </div>

      {/* Current lift stats */}
      <Card className="mb-4">
        <div className="text-xs text-[#737373] font-semibold uppercase tracking-widest mb-3">{lift}</div>
        {loading ? (
          <div className="text-[#737373] text-sm py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <div className="flex gap-6 flex-wrap">
            <div>
              <div className="text-4xl font-bold">
                {latest ? latest.orm : "—"}
                <span className="ml-1 text-base font-normal text-[#737373]">lbs</span>
              </div>
              <div className="text-xs text-[#737373] mt-1">Est. 1RM · {latest?.date ?? "no data"}</div>
            </div>
            {totalPct && (
              <div className={`text-2xl font-bold self-center ${parseFloat(totalPct) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {parseFloat(totalPct) > 0 ? "+" : ""}{totalPct}%
                <div className="text-xs font-normal text-[#737373]">all time</div>
              </div>
            )}
            {latestBWRatio !== null && (
              <div className="self-center">
                <div className="text-2xl font-bold text-orange-400">{latestBWRatio}×</div>
                <div className="text-xs text-[#737373]">bodyweight</div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 1RM chart */}
      {chartData.length >= 2 && (
        <Card className="mb-4">
          <div className="text-xs text-[#737373] mb-3 font-semibold uppercase tracking-widest">
            Est. 1RM Over Time
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#737373" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={40} />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#737373" }}
                itemStyle={{ color: "#f97316" }}
                formatter={(v) => [`${v} lbs`, "Est. 1RM"]}
              />
              <Line type="monotone" dataKey="orm" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#f97316" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Session history */}
      {history.length > 0 && (
        <>
          <div className="text-xs text-[#737373] mb-2 font-semibold uppercase tracking-widest">Session History</div>
          <div className="flex flex-col gap-2">
            {[...history].reverse().slice(0, 20).map((h, i, arr) => {
              const prev = arr[i + 1];
              const deltaOrm = prev ? h.orm - prev.orm : 0;
              const ratio = bwRatio(h);
              return (
                <Card key={h.date} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-semibold">{h.orm} lbs</span>
                    <span className="ml-2 text-xs text-[#737373]">{h.date}</span>
                    {ratio !== null && (
                      <span className="ml-2 text-xs text-orange-400">{ratio}× BW</span>
                    )}
                  </div>
                  {prev && (
                    <div className={`text-sm font-semibold shrink-0 ml-2 ${deltaOrm >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {deltaOrm > 0 ? "+" : ""}{deltaOrm} lbs
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {!loading && history.length === 0 && (
        <Card>
          <div className="text-[#737373] text-sm">
            No data found for &quot;{lift}&quot;. Make sure the name matches exactly what&apos;s in Hevy.
          </div>
        </Card>
      )}
    </Shell>
  );
}
