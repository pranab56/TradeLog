"use client";

import EquityCurveChart from '@/components/charts/EquityCurveChart';
import ProfitLossChart from '@/components/charts/ProfitLossChart';
import KPICard from '@/components/dashboard/KPICard';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { useGetAnalyticsQuery } from '@/features/trades/tradesApi';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Percent,
  Target,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const { data, isLoading, error } = useGetAnalyticsQuery(undefined);

  if (isLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)] text-destructive">
      <p>Failed to load analytics records.</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Trading Overview</h1>
            <p className="text-muted-foreground">Welcome back! Here's your performance summary.</p>
          </div>
        </div>


        {/* First Row: KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Net Profit"
            value={`${(data?.netProfit || 0) >= 0 ? '+' : '-'}$${Math.abs(data?.netProfit || 0).toLocaleString()}`}
            icon={TrendingUp}
            color={(data?.netProfit || 0) >= 0 ? 'profit' : 'loss'}
          />

          <KPICard
            title="Win Rate"
            value={`${data?.winRate?.toFixed(1) || 0}%`}
            icon={Percent}
            color="profit"
          />
          <KPICard
            title="Avg Profit / Trade"
            value={`$${data?.avgProfit?.toFixed(2) || 0}`}
            icon={ArrowUpRight}
            color="profit"
          />
          <KPICard
            title="Avg Loss / Trade"
            value={`$${data?.avgLoss?.toFixed(2) || 0}`}
            icon={ArrowDownRight}
            color="loss"
          />
        </div>

        {/* Second Row: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border bg-card/50 backdrop-blur-sm rounded-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Profit/Loss Trend</h3>
              </div>
            </div>
            <ProfitLossChart data={data?.chartData || []} />
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm rounded-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-profit/10 text-profit">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Equity Curve</h3>
              </div>
            </div>
            <EquityCurveChart data={data?.chartData || []} />
          </Card>
        </div>

        {/* Third Row: More Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border border-border p-6 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground mb-4">Consistency Metrics</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Max Drawdown</span>
                <span className="font-bold text-loss">-${data?.maxDrawdown?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Best Trading Day</span>
                <span className="font-bold text-profit">+${data?.bestDay?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Worst Trading Day</span>
                <span className="font-bold text-loss">-${Math.abs(data?.worstDay)?.toLocaleString() || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-card/50 border border-border p-6 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground mb-4">Streak Data</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Winning Streak</span>
                <span className="font-bold text-profit">{data?.winningStreak || 0} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Losing Streak</span>
                <span className="font-bold text-loss">{data?.losingStreak || 0} Days</span>
              </div>
            </div>
          </Card>

          <div className="bg-primary p-8 rounded-xl text-primary-foreground shadow-xl shadow-primary/20 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
            <div>
              <h4 className="text-lg font-bold mb-2">Ready to trade?</h4>
              <p className="text-primary-foreground/80 text-sm">Every record you add here influences your overall performance metrics.</p>
            </div>
            <Link href="/trades" className="mt-6 cursor-pointer bg-white text-primary w-full py-3 rounded-xl font-bold text-sm text-center">
              Open Trading Journal
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
