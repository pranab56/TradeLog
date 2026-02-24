"use client";

import TradeCountBarChart from '@/components/charts/TradeCountBarChart';
import WinLossPieChart from '@/components/charts/WinLossPieChart';
import MainLayout from '@/components/layout/MainLayout';
import { useGetAnalyticsQuery } from '@/features/trades/tradesApi';
import {
  AlertCircle,
  BarChart as BarChartIcon,
  Loader2,
  PieChart as PieChartIcon,
  Trophy
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data, isLoading, error } = useGetAnalyticsQuery(undefined);

  if (isLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)] text-destructive font-medium">
      Failed to load analytics records.
    </div>
  );

  const totalWins = data?.totalWins || 0;
  const totalLosses = data?.totalLosses || 0;
  const chartData = data?.chartData || [];

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1 uppercase">Advanced Metrics</h1>
            <p className="text-muted-foreground font-medium">Deep dive into your isolated trading database intelligence.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-card border border-border p-8 rounded-[2rem] flex flex-col items-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />

            <div className="flex items-center space-x-3 self-start mb-8 relative z-10">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Outcome Distribution</h3>
            </div>

            <WinLossPieChart wins={totalWins} losses={totalLosses} />

            <div className="mt-8 grid grid-cols-2 gap-8 w-full relative z-10">
              <div className="text-center p-4 bg-profit/5 rounded-2xl border border-profit/10">
                <p className="text-[10px] text-profit font-black uppercase tracking-widest mb-1">Total Wins</p>
                <p className="text-3xl font-black text-profit">{totalWins}</p>
              </div>
              <div className="text-center p-4 bg-loss/5 rounded-2xl border border-loss/10">
                <p className="text-[10px] text-loss font-black uppercase tracking-widest mb-1">Total Losses</p>
                <p className="text-3xl font-black text-loss">{totalLosses}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card border border-border p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mb-20 blur-3xl" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <BarChartIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight">Activity Log Volume</h3>
              </div>
              <div className="bg-muted px-4 py-1.5 rounded-full">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{chartData.length} Sample Points</span>
              </div>
            </div>

            <TradeCountBarChart data={chartData} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-green-500/10 via-background to-primary/5 border border-green-500/20 p-8 rounded-[2rem] shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3.5 rounded-2xl bg-green-500 text-white shadow-xl shadow-green-500/20">
                <Trophy className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight">Consistency Insights</h4>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Growth Identifiers</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-border">
                <div className="w-2 h-10 rounded-full bg-green-500" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Win Rate Performance</p>
                  <p className="text-sm font-black italic">Your win rate is currently {data?.winRate?.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-border">
                <div className="w-2 h-10 rounded-full bg-green-500" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Profit Streak</p>
                  <p className="text-sm font-black italic">Best run: {data?.winningStreak} consecutive profitable logs.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 via-background to-primary/5 border border-red-500/20 p-8 rounded-[2rem] shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3.5 rounded-2xl bg-red-500 text-white shadow-xl shadow-red-500/20">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xl font-black uppercase tracking-tight">Risk Exposure Alert</h4>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Drawdown Analysis</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-border">
                <div className="w-2 h-10 rounded-full bg-red-500" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Capital Exposure</p>
                  <p className="text-sm font-black italic text-loss">Maximum drawdown recorded: ${data?.maxDrawdown?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-border">
                <div className="w-2 h-10 rounded-full bg-red-500" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Average Risk Cost</p>
                  <p className="text-sm font-black italic text-loss">Typical cost per losing log: ${data?.avgLoss?.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
