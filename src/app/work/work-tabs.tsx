"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  PenTool,
  Wrench,
  Settings,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import { fos } from "@/lib/fos";
import { DashboardPanel } from "./dashboard-panel";
import { AiCoachPanel } from "./ai-coach-panel";
import { ContentStudioPanel } from "./content-studio-panel";
import { SettingsPanel } from "./settings-panel";
import type { Project, NotionClientRecord } from "@/lib/notion";
import type { CalendarEvent } from "@/lib/calendar";

const SUB_TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "ai-coach", label: "AI Coach", icon: Sparkles },
  { id: "content-studio", label: "Content Studio", icon: PenTool },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type SubTabId = (typeof SUB_TABS)[number]["id"];

const STATUS_COLOR: Record<string, "neutral" | "green" | "blue" | "yellow"> = {
  Inbox: "yellow",
  Planning: "neutral",
  "In progress": "blue",
  Completed: "green",
};

const PRIORITY_COLOR: Record<string, "neutral" | "yellow" | "red"> = {
  "Low Priority": "neutral",
  "Medium Priority": "yellow",
  "High Priority": "red",
};

export function WorkTabs({
  projects,
  clients,
  events,
  notionReady,
  calendarReady,
  notionError,
  calendarError,
  mrr,
  mrrChangePct,
  mrrLastUpdated,
  moneyThisMonth,
}: {
  projects: Project[];
  clients: NotionClientRecord[];
  events: CalendarEvent[];
  notionReady: boolean;
  calendarReady: boolean;
  notionError: string | null;
  calendarError: string | null;
  mrr: number;
  mrrChangePct: number | null;
  mrrLastUpdated: string | null;
  moneyThisMonth: number;
}) {
  const [active, setActive] = useState<SubTabId>("dashboard");

  useEffect(() => {
    // Restore the last sub-tab from localStorage — an external system that
    // isn't available during SSR, so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(fos.get<SubTabId>("workTab", "dashboard"));
  }, []);

  function navigate(id: SubTabId) {
    setActive(id);
    fos.set("workTab", id);
  }

  const grouped: Record<string, Project[]> = {
    Inbox: [],
    Planning: [],
    "In progress": [],
    Completed: [],
  };
  for (const p of projects) {
    const key = p.status ?? "Inbox";
    (grouped[key] ??= []).push(p);
  }

  const activeProjects = projects.filter((p) => p.status === "In progress");

  return (
    <div className="space-y-6">
      <div>
        <p
          className="text-[11px] uppercase tracking-wider mb-2 num"
          style={{ color: "var(--text-faint)" }}
        >
          Founder OS
        </p>
        <h1 className="text-[34px]" style={{ color: "var(--text)" }}>
          Work &amp; Projects
        </h1>
      </div>

      <div
        className="flex flex-wrap gap-1 rounded-xl p-1 w-fit"
        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
      >
        {SUB_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors"
              style={{
                background: isActive ? "var(--surface-active)" : "transparent",
                color: isActive ? "var(--text)" : "var(--text-dim)",
              }}
            >
              <Icon size={14} color={isActive ? "var(--accent)" : "currentColor"} />
              {label}
            </button>
          );
        })}
      </div>

      {!notionReady && (
        <SetupNotice>
          Notion isn&apos;t connected yet. Add <code>NOTION_TOKEN</code> to{" "}
          <code>.env.local</code> and share your Business OS pages with the
          integration to see live projects and clients here.
        </SetupNotice>
      )}
      {notionError && <SetupNotice>{notionError}</SetupNotice>}
      {!calendarReady && (
        <SetupNotice>
          Google Calendar isn&apos;t connected yet. Add the Google OAuth
          variables to <code>.env.local</code> to see today&apos;s events.
        </SetupNotice>
      )}
      {calendarError && <SetupNotice>{calendarError}</SetupNotice>}

      {active === "dashboard" && (
        <DashboardPanel
          activeProjects={activeProjects}
          events={events}
          mrr={mrr}
          mrrChangePct={mrrChangePct}
          mrrLastUpdated={mrrLastUpdated}
          moneyThisMonth={moneyThisMonth}
          onOpenAiCoach={() => navigate("ai-coach")}
        />
      )}

      {active === "projects" && (
        <div className="space-y-6">
          <Card title="Clients">
            {clients.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                No clients found.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {clients.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <div style={{ color: "var(--text)" }}>{c.name}</div>
                      {c.email && (
                        <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {c.email}
                        </div>
                      )}
                    </div>
                    <Badge color="blue">
                      {c.dealCount} deal{c.dealCount === 1 ? "" : "s"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Projects">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(grouped).map(([status, items]) => (
                <div key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge color={STATUS_COLOR[status] ?? "neutral"}>{status}</Badge>
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg p-3"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
                      >
                        <div className="text-sm" style={{ color: "var(--text)" }}>
                          {p.name || "(untitled)"}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          {p.priority && (
                            <Badge color={PRIORITY_COLOR[p.priority] ?? "neutral"}>
                              {p.priority.replace(" Priority", "")}
                            </Badge>
                          )}
                          {p.taskCount > 0 && (
                            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                              {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                        Nothing here.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {active === "ai-coach" && <AiCoachPanel onOpenSettings={() => navigate("settings")} />}

      {active === "content-studio" && (
        <ContentStudioPanel onOpenSettings={() => navigate("settings")} />
      )}

      {active === "tools" && (
        <div>
          <h1 style={{ color: "var(--text)" }}>Tools</h1>
        </div>
      )}

      {active === "settings" && <SettingsPanel />}
    </div>
  );
}
