"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface EquityCurveChartProps {
  data: { date: string; equity: number; net?: number }[];
}

export default function EquityCurveChart({ data }: EquityCurveChartProps) {
  const totalPnL = data.reduce((acc, item) => acc + (item.net || 0), 0);
  const isPositive = totalPnL > 0;
  const isNegative = totalPnL < 0;

  const chartColor = isPositive ? "var(--profit)" : isNegative ? "var(--loss)" : "var(--muted-foreground)";

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColor, fontSize: 10, opacity: 0.7 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColor, fontSize: 10, opacity: 0.7 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: chartColor,
              borderRadius: '12px',
              fontSize: '12px',
              color: chartColor
            }}
            itemStyle={{ color: chartColor }}
          />
          <Line
            type="stepAfter"
            dataKey="equity"
            stroke={chartColor}
            strokeWidth={4}
            dot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: chartColor, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
