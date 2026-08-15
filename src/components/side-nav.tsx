"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  Target,
  HeartPulse,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/work", label: "Work & Projects", icon: Briefcase },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/goals", label: "Personal Goals", icon: Target },
  { href: "/health", label: "Health & Fitness", icon: HeartPulse },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside
      className="relative z-[1] sticky top-0 h-screen shrink-0 flex flex-col border-r"
      style={{
        width: "var(--sidebar-w)",
        borderColor: "var(--border)",
        background: "rgba(9, 9, 9, 0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-[22px] h-[22px] rounded-md shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent), #009767)" }}
        />
        <span
          className="text-[15px] font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Life OS
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors"
              style={{
                background: isActive ? "var(--surface-active)" : "transparent",
                color: isActive ? "var(--text)" : "var(--text-dim)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-dim)";
                }
              }}
            >
              <Icon size={16} color={isActive ? "var(--accent)" : "currentColor"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        className="px-5 py-4 border-t text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
      >
        Running locally
      </div>
    </aside>
  );
}
