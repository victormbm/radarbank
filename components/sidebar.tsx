"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Bell, Filter, TrendingUp, Sparkles, LayoutDashboard } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Filtros de Alerta", href: "/filters", icon: Filter },
  { name: "Bancos", href: "/banks-list", icon: TrendingUp },
  { name: "Eventos", href: "/alerts", icon: Bell, badge: 4 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col border-r bg-gradient-to-b from-white via-purple-50/30 to-white">
      <div className="flex h-28 items-center px-6 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <img src="/assets/icons/iconFavicon4.png" alt="Banco Seguro BR" className="w-[100px] sm:w-[400px] h-auto" />
          <div>
            <span className="text-xl font-bold text-gradient">Banco Seguro BR</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Pro</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={`${item.name}-${item.href}`}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "gradient-primary text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-600 hover:bg-purple-50 hover:text-purple-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-600")}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
