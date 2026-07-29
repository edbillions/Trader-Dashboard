"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_GROUPS = [
  {
    label: "Daily",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/setup-grader", label: "Setup Grader" },
      { href: "/journal", label: "Journal" },
    ],
  },
  {
    label: "History",
    items: [
      { href: "/trades", label: "Trades" },
      { href: "/calendar", label: "Calendar" },
      { href: "/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/coach", label: "Coach" },
      { href: "/prop-firms", label: "Prop Firms" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Unicorn Journal
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/60">
              {group.label}
            </span>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-raised text-foreground"
                      : "text-muted hover:bg-surface-raised hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
