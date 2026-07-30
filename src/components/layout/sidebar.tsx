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
      { href: "/playbook", label: "Playbook" },
      { href: "/journal", label: "Journal" },
      { href: "/todo", label: "To-Do" },
    ],
  },
  {
    label: "History",
    items: [
      { href: "/trades", label: "Trades" },
      { href: "/missed-trades", label: "Missed Trades" },
      { href: "/calendar", label: "Calendar" },
      { href: "/analytics", label: "Analytics" },
      { href: "/chart-vault", label: "Chart Vault" },
    ],
  },
];

const STANDALONE_ITEMS = [
  { href: "/coach", label: "Coach" },
  { href: "/goals", label: "Goals" },
  { href: "/tendencies", label: "Tendencies" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/prop-firms", label: "Prop Firms" },
  { href: "/settings", label: "Settings" },
];

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "relative rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-surface-raised text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
          : "text-muted hover:bg-surface-raised hover:text-foreground",
      )}
    >
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
              active={isActive(item.href)}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
