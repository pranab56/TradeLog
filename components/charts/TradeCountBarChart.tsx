"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface TradeCountBarChartProps {
  data: { date: string; totalTrades: number; net?: number }[];
}

export default function TradeCountBarChart({ data }: TradeCountBarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalPnL = data.reduce((acc, item) => acc + (item.net || 0), 0);
  const isPositive = totalPnL > 0;
  const isNegative = totalPnL < 0;

  const chartColor = isPositive ? "var(--profit)" : isNegative ? "var(--loss)" : "var(--muted-foreground)";

  if (!mounted) return <div className="h-[400px] w-full" />;

  return (
    <div className="h-[300px] md:h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            cursor={{ fill: 'var(--accent)', opacity: 0.1 }}
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: chartColor,
              borderRadius: '12px',
              color: chartColor
            }}
            itemStyle={{ color: chartColor }}
          />
          <Bar
            dataKey="totalTrades"
            fill={chartColor}
            radius={[6, 6, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
