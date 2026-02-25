import { verifyToken } from '@/lib/auth-utils';
import { getUserDb } from '@/lib/mongodb-client';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientDate = searchParams.get('date'); // Expecting YYYY-MM-DD

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded: any = verifyToken(token);
    if (!decoded || !decoded.dbName) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const db = await getUserDb(decoded.dbName);
    const rawRecords = await db.collection('trades').find({}).sort({ date: 1 }).toArray();

    // Use current server date if client doesn't provide one
    const today = clientDate || new Date().toISOString().split('T')[0];

    if (rawRecords.length === 0) {
      return NextResponse.json({
        todayProfit: 0,
        todayLoss: 0,
        todayNet: 0,
        todayWinRate: 0,
        todayAvgRR: '0:0',
        totalProfitAllTime: 0,
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
    const dailyMap: Record<string, { profit: number; loss: number; count: number; rrValues: number[]; wins: number }> = {};
    let totalProfitAllTime = 0;

    rawRecords.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      const p = parseFloat(record.profit) || 0;
      const l = parseFloat(record.loss) || 0;

      totalProfitAllTime += (p - l);

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { profit: 0, loss: 0, count: 0, rrValues: [], wins: 0 };
      }
      dailyMap[dateKey].profit += p;
      dailyMap[dateKey].loss += l;
      dailyMap[dateKey].count += 1;
      if (p > 0) dailyMap[dateKey].wins += 1;

      // Extract RR value (e.g., "1:3" -> 3)
      if (record.riskRewardRatio && typeof record.riskRewardRatio === 'string') {
        const parts = record.riskRewardRatio.split(':');
        if (parts.length === 2) {
          const rValue = parseFloat(parts[1]) || 0;
          dailyMap[dateKey].rrValues.push(rValue);
        }
      }
    });

    const sortedDates = Object.keys(dailyMap).sort();

    let netProfit = 0;
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
        maxProfitDay = Math.max(maxProfitDay, dayNet);
        currentWinStreak++;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        currentLossStreak = 0;
      } else if (dayNet < 0) {
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

    // Legacy fields for backward compatibility if needed
    const recordWins = rawRecords.filter(r => (parseFloat(r.profit) || 0) > 0).length;
    const winRate = rawRecords.length > 0 ? (recordWins / rawRecords.length) * 100 : 0;
    const winDays = chartData.filter(d => d.net > 0);
    const avgProfit = winDays.length > 0 ? (winDays.reduce((acc, d) => acc + d.net, 0) / winDays.length) : 0;
    const daysWithLosses = chartData.filter(d => d.loss > 0);
    const avgLoss = daysWithLosses.length > 0 ? (daysWithLosses.reduce((acc, d) => acc + d.loss, 0) / daysWithLosses.length) : 0;

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

    // Today's specific metrics
    const todayData = dailyMap[today] || { profit: 0, loss: 0, count: 0, rrValues: [], wins: 0 };
    const todayWinRate = todayData.count > 0 ? (todayData.wins / todayData.count) * 100 : 0;
    const todayAvgRRValue = todayData.rrValues.length > 0
      ? todayData.rrValues.reduce((a, b) => a + b, 0) / todayData.rrValues.length
      : 0;
    const todayAvgRR = `1:${todayAvgRRValue.toFixed(1)}`;

    // All-time aggregate amounts
    const totalProfitsAllTime = rawRecords.reduce((acc, r) => acc + (parseFloat(r.profit) || 0), 0);
    const totalLossesAllTime = rawRecords.reduce((acc, r) => acc + (parseFloat(r.loss) || 0), 0);

    const profitFactor = totalLossesAllTime > 0 ? (totalProfitsAllTime / totalLossesAllTime) : totalProfitsAllTime > 0 ? Infinity : 0;
    const lossRate = 1 - (winRate / 100);
    const expectancy = (winRate / 100 * avgProfit) - (lossRate * avgLoss);

    return NextResponse.json({
      // New required metrics
      todayProfit: todayData.profit,
      todayLoss: todayData.loss,
      todayNet: todayData.profit - todayData.loss,
      todayWinRate,
      todayAvgRR,
      totalProfitAllTime,

      // Analysis metrics
      profitFactor: profitFactor === Infinity ? 999 : profitFactor,
      expectancy,

      // Existing metrics for stability
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
      totalWins: recordWins,
      totalLosses: rawRecords.length - recordWins, // This is count
      totalLossAmount: totalLossesAllTime,
      totalTrades: rawRecords.length
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
