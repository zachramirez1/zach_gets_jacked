"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const tick = { fontSize: 10, fill: "#737373" };

export default function TrendChart({ data, label, height = 160 }: {
  data: { date: string; value: number }[];
  label: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={tick} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={35} />
        <Tooltip
          contentStyle={{ background: "#141414", border: "1px solid #262626", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#737373" }}
          itemStyle={{ color: "#f97316" }}
          formatter={(v) => `${v} lbs`}
        />
        <Line name={label} type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#f97316" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
