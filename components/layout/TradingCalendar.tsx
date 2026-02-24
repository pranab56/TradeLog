"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
} from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface TradeRecord {
  _id: string;
  date: string;
  profit: number;
  loss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  notes?: string;
  riskRewardRatio?: string;
}

export function TradingCalendar() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await axios.get("/api/trades");
        setTrades(res.data);
      } catch (error) {
        console.error("Failed to fetch trades for calendar", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  const tradeDataMap = useMemo(() => {
    const map: Record<string, TradeRecord> = {};
    trades.forEach((trade) => {
      const dateKey = format(parseISO(trade.date), "yyyy-MM-dd");
      map[dateKey] = trade;
    });
    return map;
  }, [trades]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl border-border bg-accent/30 hover:bg-accent/50 transition-all flex items-center space-x-2 cursor-pointer shadow-sm active:scale-95"
        >
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="hidden md:inline font-bold text-xs tracking-tight">PERFORMANCE CALENDAR</span>
          <span className="md:hidden text-xs font-bold">CALENDAR</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border bg-card shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl" align="start" sideOffset={8}>
        <div className="p-4 border-b border-border bg-accent/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">Daily Analytics</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-bold">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-profit" />
              <span className="text-profit">WIN</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-loss" />
              <span className="text-loss">LOSS</span>
            </div>
          </div>
        </div>
        <Calendar
          mode="single"
          className="p-3"
          components={{
            DayButton: ({ day, className, ...props }) => {
              const dateKey = format(day.date, "yyyy-MM-dd");
              const trade = tradeDataMap[dateKey];
              const net = trade ? trade.profit - trade.loss : 0;
              const winRate = trade && trade.totalTrades > 0 ? (trade.winningTrades / trade.totalTrades) * 100 : 0;

              if (!trade) {
                return (
                  <button
                    className={cn(
                      "h-10 w-10 p-0 font-medium text-xs aria-selected:opacity-100 items-center justify-center flex hover:bg-accent rounded-xl transition-all",
                      className
                    )}
                    {...props}
                  />
                );
              }

              return (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "h-10 w-10 p-0 font-bold text-xs aria-selected:opacity-100 items-center justify-center flex rounded-xl transition-all relative border border-transparent shadow-sm",
                          net > 0 ? "bg-profit/10 text-profit hover:bg-profit/20 border-profit/20" :
                            net < 0 ? "bg-loss/10 text-loss hover:bg-loss/20 border-loss/20" :
                              "bg-accent/50 text-muted-foreground",
                          className
                        )}
                        {...props}
                      >
                        {day.date.getDate()}
                        <div className={cn(
                          "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm ring-2 ring-background",
                          net > 0 ? "bg-profit" : net < 0 ? "bg-loss" : "bg-muted-foreground"
                        )} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="p-0 bg-transparent border-none shadow-none mt-1">
                      <div className="p-5 bg-card border border-border shadow-2xl rounded-2xl min-w-[220px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{format(day.date, "MMMM dd")}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{format(day.date, "EEEE")}</span>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                            net > 0 ? "bg-profit/20 text-profit ring-1 ring-profit/30" :
                              net < 0 ? "bg-loss/20 text-loss ring-1 ring-loss/30" :
                                "bg-accent text-muted-foreground"
                          )}>
                            {net > 0 ? "Profit" : net < 0 ? "Loss" : "Breakeven"}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-accent/30 p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5 text-muted-foreground">
                                {net >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-profit" /> : <TrendingDown className="w-3.5 h-3.5 text-loss" />}
                                <span className="text-[10px] font-bold">NET RESULT</span>
                              </div>
                              <span className={cn("text-xs font-black", net > 0 ? "text-profit" : net < 0 ? "text-loss" : "")}>
                                {net >= 0 ? "+" : ""}${Math.abs(net).toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1 bg-background rounded-full overflow-hidden flex">
                              <div
                                className={cn("h-full", net >= 0 ? "bg-profit" : "bg-loss")}
                                style={{ width: `${Math.min(100, (Math.abs(net) / 5000) * 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-accent/20 p-2 rounded-lg flex flex-col">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70">Win Rate</span>
                              <span className="text-xs font-bold text-profit">{winRate.toFixed(1)}%</span>
                            </div>
                            <div className="bg-accent/20 p-2 rounded-lg flex flex-col">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-70">Total Volume</span>
                              <span className="text-xs font-bold">{trade.totalTrades} <span className="text-[9px] opacity-50">Trades</span></span>
                            </div>
                          </div>

                          {trade.notes && (
                            <div className="pt-3 border-t border-border/50">
                              <div className="flex items-center space-x-1.5 mb-1.5">
                                <Target className="w-3 h-3 text-primary" />
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Trade Summary</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed font-medium italic">"{trade.notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
