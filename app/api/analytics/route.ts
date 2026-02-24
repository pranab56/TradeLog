import connectDB from '@/lib/db';
import DailyRecord from '@/models/DailyRecord';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const records = await DailyRecord.find({}).sort({ date: 1 });

    if (records.length === 0) {
      return NextResponse.json({
        netProfit: 0,
        winRate: 0,
        avgProfit: 0,
        avgLoss: 0,
        bestDay: 0,
        worstDay: 0,
        maxDrawdown: 0,
        winningStreak: 0,
        losingStreak: 0,
        chartData: [],
      });
    }

    let netProfit = 0;
    let totalWinTrades = 0;
    let totalLossTrades = 0;
    let totalTrades = 0;
    let profitDays = 0;
    let lossDays = 0;
    let maxProfitDay = -Infinity;
    let minProfitDay = Infinity;

    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;

    let equity = 0;
    const chartData = records.map((record) => {
      const dayNet = record.profit - record.loss;
      netProfit += dayNet;
      totalWinTrades += record.winningTrades;
      totalLossTrades += record.losingTrades;
      totalTrades += record.totalTrades;
      equity += dayNet;

      if (dayNet > 0) {
        profitDays++;
        maxProfitDay = Math.max(maxProfitDay, dayNet);
        currentWinStreak++;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentLossStreak = 0;
      } else if (dayNet < 0) {
        lossDays++;
        minProfitDay = Math.min(minProfitDay, dayNet);
        currentLossStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        currentWinStreak = 0;
      }

      return {
        date: record.date.toISOString().split('T')[0],
        profit: record.profit,
        loss: record.loss,
        net: dayNet,
        equity: equity,
      };
    });

    maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    maxLossStreak = Math.max(maxLossStreak, currentLossStreak);

    const winRate = totalTrades > 0 ? (totalWinTrades / totalTrades) * 100 : 0;
    const avgProfit = totalWinTrades > 0 ? (records.reduce((acc, r) => acc + r.profit, 0) / totalWinTrades) : 0;
    const avgLoss = totalLossTrades > 0 ? (records.reduce((acc, r) => acc + r.loss, 0) / totalLossTrades) : 0;

    // Simplified Drawdown calculation
    let peak = -Infinity;
    let maxDrawdown = 0;
    let currentEquity = 0;
    records.forEach(r => {
      currentEquity += (r.profit - r.loss);
      if (currentEquity > peak) peak = currentEquity;
      const drawdown = peak - currentEquity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return NextResponse.json({
      netProfit,
      winRate,
      avgProfit,
      avgLoss,
      bestDay: maxProfitDay === -Infinity ? 0 : maxProfitDay,
      worstDay: minProfitDay === Infinity ? 0 : minProfitDay,
      maxDrawdown,
      winningStreak: maxWinStreak,
      losingStreak: maxLossStreak,
      chartData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
