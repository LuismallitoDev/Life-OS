"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export type DailyPoint = { day: string; income: number };

export function WeeklyPulseChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2939" />
        <XAxis dataKey="day" stroke="#7b7b7b" fontSize={12} />
        <YAxis stroke="#7b7b7b" fontSize={12} width={48} />
        <Tooltip
          contentStyle={{ background: "#141414", border: "1px solid #1e2939" }}
          labelStyle={{ color: "#d8d8d8" }}
          formatter={(value) => [
            Number(value).toLocaleString(undefined, { style: "currency", currency: "USD" }),
            "Income",
          ]}
        />
        <Bar dataKey="income" fill="#00d294" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
