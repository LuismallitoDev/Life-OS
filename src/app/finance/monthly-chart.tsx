"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export type MonthlyPoint = { month: string; income: number; expense: number };

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2939" />
        <XAxis dataKey="month" stroke="#7b7b7b" fontSize={12} />
        <YAxis stroke="#7b7b7b" fontSize={12} />
        <Tooltip
          contentStyle={{ background: "#141414", border: "1px solid #1e2939" }}
          labelStyle={{ color: "#d8d8d8" }}
        />
        <Legend />
        <Bar dataKey="income" fill="#00d294" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#ff6568" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
