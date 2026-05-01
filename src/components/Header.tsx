import { Link, useLocation } from "react-router-dom";
import { ScanLine, LayoutDashboard, UserPlus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Beranda", icon: Activity },
  { to: "/daftar", label: "Daftar Pasien", icon: UserPlus },
  { to: "/dokter", label: "Scan Dokter", icon: ScanLine },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <div className="h-9 w-9 rounded-xl overflow-hidden shadow-soft">
            <img src="/img/logotitle.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <span>Self Healty Care</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
