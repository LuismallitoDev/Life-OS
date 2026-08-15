"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  Target,
  HeartPulse,
  PenTool,
  Wrench,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { fos } from "@/lib/fos";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/work", label: "Work & Projects", icon: Briefcase },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/goals", label: "Personal Goals", icon: Target },
  { href: "/health", label: "Health & Fitness", icon: HeartPulse },
  { href: "/content-studio", label: "Content Studio", icon: PenTool },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const COLLAPSED_KEY = "navCollapsed";
const EXPANDED_W = 248;
const COLLAPSED_W = 68;

// Text that fades and shrinks away instead of popping in/out, so it stays
// in sync with the width transition instead of cutting abruptly.
function NavLabel({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <span
      className="overflow-hidden whitespace-nowrap"
      style={{
        maxWidth: show ? 200 : 0,
        opacity: show ? 1 : 0,
        transition: "max-width 220ms var(--ease), opacity 150ms var(--ease)",
      }}
    >
      {children}
    </span>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(fos.get<boolean>(COLLAPSED_KEY, false));
    setHydrated(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    fos.set(COLLAPSED_KEY, next);
    if (next === false) setPeeking(false);
  }

  // Render expanded on the very first paint (before hydration reads the
  // saved preference) to avoid a layout flash of the wrong width.
  const isCollapsed = hydrated && collapsed;
  // When collapsed, hovering the rail temporarily expands it — and, since
  // this changes the aside's own layout width (not an overlay), the main
  // content area reflows with it instead of being covered.
  const showLabels = !isCollapsed || peeking;
  const panelWidth = showLabels ? EXPANDED_W : COLLAPSED_W;
  const rowTransition = "padding 220ms var(--ease), gap 220ms var(--ease)";

  return (
    <aside
      className="relative z-[1] sticky top-0 h-screen shrink-0 flex flex-col border-r"
      style={{
        width: panelWidth,
        borderColor: "var(--border)",
        background: "rgba(9, 9, 9, 0.92)",
        backdropFilter: "blur(8px)",
        transition: "width 220ms var(--ease)",
      }}
      onMouseEnter={() => isCollapsed && setPeeking(true)}
      onMouseLeave={() => setPeeking(false)}
    >
      <div
        className="flex items-center py-6 border-b"
        style={{
          borderColor: "var(--border)",
          gap: showLabels ? 10 : 0,
          paddingLeft: showLabels ? 20 : 0,
          paddingRight: showLabels ? 20 : 0,
          justifyContent: showLabels ? "flex-start" : "center",
          transition: rowTransition,
        }}
      >
        <div
          className="w-[22px] h-[22px] rounded-md shrink-0"
          style={{ background: "linear-gradient(135deg, var(--accent), #009767)" }}
        />
        <NavLabel show={showLabels}>
          <span
            className="text-[15px] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Life OS
          </span>
        </NavLabel>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={!showLabels ? label : undefined}
              className="flex items-center rounded-lg text-[13.5px] font-medium transition-colors"
              style={{
                background: isActive ? "var(--surface-active)" : "transparent",
                color: isActive ? "var(--text)" : "var(--text-dim)",
                gap: showLabels ? 10 : 0,
                paddingLeft: showLabels ? 12 : 8,
                paddingRight: showLabels ? 12 : 8,
                paddingTop: showLabels ? 8 : 10,
                paddingBottom: showLabels ? 8 : 10,
                justifyContent: showLabels ? "flex-start" : "center",
                transition: `${rowTransition}, background 140ms var(--ease), color 140ms var(--ease)`,
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
              <Icon size={16} color={isActive ? "var(--accent)" : "currentColor"} className="shrink-0" />
              <NavLabel show={showLabels}>{label}</NavLabel>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        title={isCollapsed ? "Pin sidebar open" : "Collapse sidebar"}
        className="flex items-center border-t text-xs transition-colors py-4"
        style={{
          borderColor: "var(--border)",
          color: "var(--text-faint)",
          gap: showLabels ? 8 : 0,
          paddingLeft: showLabels ? 20 : 0,
          paddingRight: showLabels ? 20 : 0,
          justifyContent: showLabels ? "flex-start" : "center",
          transition: `${rowTransition}, color 140ms var(--ease)`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        <NavLabel show={showLabels}>{isCollapsed ? "Pin open" : "Collapse"}</NavLabel>
      </button>
    </aside>
  );
}
