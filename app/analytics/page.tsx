"use client";

import TradeCountBarChart from '@/components/charts/TradeCountBarChart';
import WinLossPieChart from '@/components/charts/WinLossPieChart';
import MainLayout from '@/components/layout/MainLayout';
import axios from 'axios';
import {
  AlertCircle,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Trophy
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/analytics');
        const tradesRes = await axios.get('/api/trades');
        setData({ ...res.data, rawRecords: tradesRes.data });
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-120px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  const totalWins = data?.rawRecords?.reduce((acc: number, r: any) => acc + r.winningTrades, 0) || 0;
  const totalLosses = data?.rawRecords?.reduce((acc: number, r: any) => acc + r.losingTrades, 0) || 0;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Detailed Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your trading psychology and results.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-card border border-border p-8 rounded-xl flex flex-col items-center">
            <div className="flex items-center space-x-3 self-start mb-8">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">Win vs Loss Ratio</h3>
            </div>
            <WinLossPieChart wins={totalWins} losses={totalLosses} />
            <div className="mt-8 grid grid-cols-2 gap-8 w-full">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 font-medium">Total Wins</p>
                <p className="text-2xl font-bold text-profit">{totalWins}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 font-medium">Total Losses</p>
                <p className="text-2xl font-bold text-loss">{totalLosses}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-card border border-border p-8 rounded-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BarChartIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Daily Trade Volume</h3>
              </div>
            </div>
            <TradeCountBarChart data={data?.chartData?.map((d: any) => ({ ...d, totalTrades: data.rawRecords.find((r: any) => r.date.split('T')[0] === d.date)?.totalTrades || 0 })) || []} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-profit/10 to-primary/5 border border-profit/20 p-8 rounded-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-profit text-profit-foreground shadow-lg shadow-profit/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Performance Insights</h4>
                <p className="text-sm opacity-70 font-medium">Key strengths in your strategy</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-profit" />
                <span>Your win rate of {data?.winRate?.toFixed(1)}% is above average.</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-profit" />
                <span>Best winning streak: {data?.winningStreak} consecutive profitable days.</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-loss/10 to-primary/5 border border-loss/20 p-8 rounded-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 rounded-2xl bg-loss text-loss-foreground shadow-lg shadow-loss/20">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Risk Management</h4>
                <p className="text-sm opacity-70 font-medium">Optimization opportunities</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-loss" />
                <span>Maximum drawdown recorded: ${data?.maxDrawdown?.toLocaleString()}.</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-loss" />
                <span>Average loss per trade is ${data?.avgLoss?.toFixed(2)}.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
