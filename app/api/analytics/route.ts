import { verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.dbName) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const db = await getUserDb(decoded.dbName);
    const rawRecords = await db.collection('trades').find({}).sort({ date: 1 }).toArray();

    if (rawRecords.length === 0) {
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
        totalWins: 0,
        totalLosses: 0,
        totalTrades: 0
      });
    }

    // Aggregate records by date
    const dailyMap: Record<string, { profit: number; loss: number; count: number }> = {};
    rawRecords.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { profit: 0, loss: 0, count: 0 };
      }
      dailyMap[dateKey].profit += parseFloat(record.profit) || 0;
      dailyMap[dateKey].loss += parseFloat(record.loss) || 0;
      dailyMap[dateKey].count += 1;
    });

    const sortedDates = Object.keys(dailyMap).sort();

    let netProfit = 0;
    let totalWinDays = 0;
    let totalLossDays = 0;
    let maxProfitDay = -Infinity;
    let minProfitDay = Infinity;

    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;

    let equity = 0;
    const chartData = sortedDates.map((date) => {
      const { profit, loss, count } = dailyMap[date];
      const dayNet = profit - loss;

      netProfit += dayNet;
      equity += dayNet;

      if (dayNet > 0) {
        totalWinDays++;
        maxProfitDay = Math.max(maxProfitDay, dayNet);
        currentWinStreak++;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentLossStreak = 0;
      } else if (dayNet < 0) {
        totalLossDays++;
        minProfitDay = Math.min(minProfitDay, dayNet);
        currentLossStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        currentWinStreak = 0;
      }

      return {
        date,
        profit,
        loss,
        net: dayNet,
        equity: equity,
        totalTrades: count
      };
    });

    maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    maxLossStreak = Math.max(maxLossStreak, currentLossStreak);

    const totalDays = sortedDates.length;
    const winRate = totalDays > 0 ? (totalWinDays / totalDays) * 100 : 0;

    // Average calculated per trade record, not per day
    const totalWinsCount = rawRecords.filter(r => (parseFloat(r.profit) || 0) > 0).length;
    const totalLossesCount = rawRecords.filter(r => (parseFloat(r.loss) || 0) > 0).length;
    const avgProfit = totalWinsCount > 0 ? (rawRecords.reduce((acc, r) => acc + (parseFloat(r.profit) || 0), 0) / totalWinsCount) : 0;
    const avgLoss = totalLossesCount > 0 ? (rawRecords.reduce((acc, r) => acc + (parseFloat(r.loss) || 0), 0) / totalLossesCount) : 0;

    // Drawdown calculation
    let peak = -Infinity;
    let maxDrawdown = 0;
    let runningEquity = 0;
    chartData.forEach(d => {
      runningEquity = d.equity;
      if (runningEquity > peak) peak = runningEquity;
      const drawdown = peak - runningEquity;
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
      totalWins: totalWinsCount,
      totalLosses: totalLossesCount,
      totalTrades: rawRecords.length
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
