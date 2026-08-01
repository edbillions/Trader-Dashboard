"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Sunrise,
  ClipboardCheck,
  BookOpen,
  PenLine,
  StickyNote,
  CheckSquare,
  CalendarClock,
  TrendingUp,
  Ban,
  Calendar,
  BarChart3,
  ClipboardList,
  Images,
  GraduationCap,
  Target,
  Repeat,
  AlertTriangle,
  Building2,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Daily",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/premarket", label: "Pre-Market Analyst", icon: Sunrise },
      { href: "/setup-grader", label: "Setup Grader", icon: ClipboardCheck },
      { href: "/playbook", label: "Playbook", icon: BookOpen },
      { href: "/journal", label: "Journal", icon: PenLine },
      { href: "/notebook", label: "Notebook", icon: StickyNote },
      { href: "/todo", label: "To-Do", icon: CheckSquare },
      { href: "/schedule", label: "Schedule", icon: CalendarClock },
    ],
  },
  {
    label: "History",
    items: [
      { href: "/trades", label: "Trades", icon: TrendingUp },
      { href: "/missed-trades", label: "Missed Trades", icon: Ban },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reviews", label: "Reviews", icon: ClipboardList },
      { href: "/chart-vault", label: "Chart Vault", icon: Images },
    ],
  },
];

const STANDALONE_ITEMS = [
  { href: "/coach", label: "Coach", icon: GraduationCap },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tendencies", label: "Tendencies", icon: Repeat },
  { href: "/mistakes", label: "Mistakes", icon: AlertTriangle },
  { href: "/prop-firms", label: "Prop Firms", icon: Building2 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-surface-raised text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
          : "text-muted hover:bg-surface-raised hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="text-lg font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            Trader
          </span>{" "}
          <span className="text-foreground">Hub</span>
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/60">
              {group.label}
            </span>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
              />
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-1">
          {STANDALONE_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
