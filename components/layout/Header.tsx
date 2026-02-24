import { format } from 'date-fns';
import { Clock, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TradingCalendar } from './TradingCalendar';

export default function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search records..."
            className="w-64 bg-accent/50 py-2 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/20"
          />
        </div>

        <div className="flex items-center space-x-3 bg-accent/50 p-1.5 rounded-xl pl-3">
          <div className="flex flex-col items-end mr-1">
            <span className="text-xs font-bold leading-none">TRADER</span>
            <span className="text-[10px] text-primary font-medium tracking-wider">ACTIVE</span>
          </div>
          <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold">
            T
          </div>
        </div>
      </div>
    </header>
  );
}

