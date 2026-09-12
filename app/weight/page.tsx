"use client";
import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/Card";
import {
  getWeightLog,
  addWeightEntry,
  deleteWeightEntry,
  getUnits,
  type WeightEntry,
} from "@/lib/store";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

export default function WeightPage() {
  const [log, setLog] = useState<WeightEntry[]>([]);
  const [units, setUnits] = useState("lbs");
  const [input, setInput] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLog(getWeightLog());
    setUnits(getUnits());
  }, []);

  if (!mounted) return null;

  function save() {
    const w = parseFloat(input);
    if (!w || w < 50 || w > 500) return;
    addWeightEntry({ date, weight: w });
    setLog(getWeightLog());
    setInput("");
  }

  function remove(d: string) {
    deleteWeightEntry(d);
    setLog(getWeightLog());
  }

  const chartData = log.slice(-30).map((e) => ({
    date: e.date.slice(5),
    weight: e.weight,
  }));

  const first = log.at(0);
  const latest = log.at(-1);
  const totalChange = first && latest && first.date !== latest.date
    ? (latest.weight - first.weight).toFixed(1)
    : null;
  const totalPct = first && latest && first.date !== latest.date
    ? ((latest.weight - first.weight) / first.weight * 100).toFixed(1)
    : null;
  const avg7 = log.length >= 2
    ? (log.slice(-7).reduce((s, e) => s + e.weight, 0) / Math.min(log.length, 7)).toFixed(1)
    : null;

  return (
    <Shell title="Body Weight">
      {/* Log entry */}
      <Card className="mb-4">
        <div className="text-xs text-[#737373] mb-3 font-semibold uppercase tracking-widest">Log Weight</div>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-[#f5f5f5] flex-1"
          />
          <div className="flex gap-2 flex-1">
            <input
              type="number"
              inputMode="decimal"
              placeholder={`Weight (${units})`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="rounded-lg bg-[#0a0a0a] border border-[#262626] px-3 py-2 text-sm text-[#f5f5f5] w-full"
            />
            <button
              onClick={save}
              className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white text-sm shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {log.length >= 2 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="text-center">
            <div className="text-xs text-[#737373] mb-1">Current</div>
            <div className="text-lg font-bold">{latest?.weight}</div>
            <div className="text-xs text-[#737373]">{units}</div>
          </Card>
          <Card className="text-center">
            <div className="text-xs text-[#737373] mb-1">7-day avg</div>
            <div className="text-lg font-bold">{avg7}</div>
            <div className="text-xs text-[#737373]">{units}</div>
          </Card>
          <Card className="text-center">
            <div className="text-xs text-[#737373] mb-1">Total Δ</div>
            <div className={`text-lg font-bold ${totalChange && parseFloat(totalChange) <= 0 ? "text-green-400" : "text-orange-400"}`}>
              {totalChange ? (parseFloat(totalChange) > 0 ? `+${totalChange}` : totalChange) : "—"}
            </div>
            {totalPct && (
              <div className={`text-xs ${parseFloat(totalPct) <= 0 ? "text-green-400" : "text-orange-400"}`}>
                {parseFloat(totalPct) > 0 ? "+" : ""}{totalPct}%
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 && (
        <Card className="mb-4">
          <div className="text-xs text-[#737373] mb-3 font-semibold uppercase tracking-widest">Last 30 Entries</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#737373" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fontSize: 10, fill: "#737373" }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                width={35}
              />
              <Tooltip
                contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#737373" }}
                itemStyle={{ color: "#f97316" }}
              />
              {avg7 && <ReferenceLine y={parseFloat(avg7)} stroke="#262626" strokeDasharray="4 4" />}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#f97316" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Log list */}
      <div className="text-xs text-[#737373] mb-2 font-semibold uppercase tracking-widest">History</div>
      {log.length === 0 ? (
        <Card><div className="text-[#737373] text-sm">No entries yet. Log your first weight above.</div></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {[...log].reverse().map((e) => (
            <Card key={e.date} className="flex items-center justify-between py-3">
              <div>
                <span className="font-semibold">{e.weight} {units}</span>
                <span className="ml-2 text-xs text-[#737373]">{e.date}</span>
              </div>
              <button
                onClick={() => remove(e.date)}
                className="text-[#737373] text-lg px-2"
                aria-label="Delete"
              >
                ×
              </button>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
