import {
  BarChart3,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: History },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card/50 backdrop-blur-xl border-r border-border h-screen sticky top-0 flex flex-col transition-all duration-300">
      <div className="p-8 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <TrendingUp className="text-primary-foreground w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">TradeLog</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground font-medium mb-2">PRO TIP</p>
          <p className="text-sm leading-relaxed">
            Consistency is key to a successful trading journey.
          </p>
        </div>
      </div>
    </aside>
  );
}

