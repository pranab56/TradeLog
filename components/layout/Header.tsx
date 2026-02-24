"use client";

import { useGetMeQuery } from '@/features/auth/authApi';
import { format } from 'date-fns';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TradingCalendar } from './TradingCalendar';

export default function Header() {
  const [time, setTime] = useState(new Date());
  const { data, isLoading } = useGetMeQuery(undefined);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userName = data?.user?.name || 'TRADER';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="h-20 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <TradingCalendar />

        <div className="hidden lg:flex items-center space-x-2 bg-accent/30 px-4 py-2 rounded-xl text-sm font-medium border border-border/50">
          <Clock className="w-4 h-4 text-primary/70" />
          <span className="text-muted-foreground">
            {format(time, 'HH:mm:ss')}
          </span>
          <span className="text-[10px] text-muted-foreground/50 ml-1">UTC+6</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">


        <div className="flex items-center space-x-3 bg-accent/50 p-1.5 rounded-xl pl-3">
          <div className="flex flex-col items-end mr-1">
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : (
              <span className="text-xs font-bold leading-none uppercase truncate max-w-[100px]">{userName}</span>
            )}
            <span className="text-[10px] text-primary font-medium tracking-wider">ACTIVE</span>
          </div>
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black shadow-inner">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : initial}
          </div>
        </div>
      </div>
    </header>
  );
}
