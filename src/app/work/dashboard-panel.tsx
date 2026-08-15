"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, Badge } from "@/components/ui";
import { fos } from "@/lib/fos";
import type { Project } from "@/lib/notion";
import type { CalendarEvent } from "@/lib/calendar";

const PRIORITY_COLOR: Record<string, "neutral" | "yellow" | "red"> = {
  "Low Priority": "neutral",
  "Medium Priority": "yellow",
  "High Priority": "red",
};

const STATUS_PROGRESS: Record<string, number> = {
  Inbox: 10,
  Planning: 35,
  "In progress": 65,
  Completed: 100,
};

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function DashboardPanel({
  activeProjects,
  events,
  mrr,
  mrrChangePct,
  mrrLastUpdated,
  moneyThisMonth,
  onOpenAiCoach,
}: {
  activeProjects: Project[];
  events: CalendarEvent[];
  mrr: number;
  mrrChangePct: number | null;
  mrrLastUpdated: string | null;
  moneyThisMonth: number;
  onOpenAiCoach: () => void;
}) {
  const [greeting, setGreeting] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const [focus, setFocus] = useState("");
  const [wins, setWins] = useState("");
  const [winsSaved, setWinsSaved] = useState(false);
  const [contentPieceCount, setContentPieceCount] = useState<number | null>(null);

  useEffect(() => {
    // Hydrate date-scoped fields from localStorage — only available client-side.
    const now = new Date();
    const todayKey = format(now, "yyyy-MM-dd");
    const name = fos.get<string>("founderName", "").trim();
    const part = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(name ? `${part}, ${name}` : part);
    setTodayLabel(format(now, "EEEE, MMMM d"));
    setFocus(fos.get<string>(`focus_${todayKey}`, ""));
    setWins(fos.get<string>(`wins_${todayKey}`, ""));
    setContentPieceCount(fos.get<unknown[]>("contentPieces", []).length);
  }, []);

  function handleFocusChange(value: string) {
    setFocus(value);
    const todayKey = format(new Date(), "yyyy-MM-dd");
    fos.set(`focus_${todayKey}`, value);
  }

  function handleSaveWins() {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    fos.set(`wins_${todayKey}`, wins);
    setWinsSaved(true);
    setTimeout(() => setWinsSaved(false), 1800);
  }

  const deltaColor = mrrChangePct === null ? "neutral" : mrrChangePct >= 0 ? "green" : "red";
  const deltaLabel =
    mrrChangePct === null
      ? "no prior month"
      : `${mrrChangePct >= 0 ? "+" : ""}${mrrChangePct.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* 1. Hero — today's date + North Star Focus */}
      <Card
        style={{
          borderColor: "rgba(0, 210, 148, 0.22)",
          background: "linear-gradient(165deg, rgba(0, 210, 148, 0.08), var(--bg-elevated) 55%)",
        }}
      >
        <p className="text-[11px] uppercase tracking-wider num" style={{ color: "var(--accent)" }}>
          {todayLabel || "Today"}
        </p>
        <h2
          className="mt-2 text-[26px]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--text)" }}
        >
          {greeting || " "}
        </h2>

        <label
          className="mt-5 block text-[11.5px] uppercase tracking-wide mb-2"
          style={{ color: "var(--text-faint)" }}
          htmlFor="north-star-focus"
        >
          North Star Focus
        </label>
        <input
          id="north-star-focus"
          type="text"
          value={focus}
          onChange={(e) => handleFocusChange(e.target.value)}
          placeholder="What's the one thing you're focused on today?"
          className="w-full rounded-lg px-3.5 py-2.5 text-[14.5px] outline-none"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </Card>

      {/* 2. Revenue tracker */}
      <Card title="Revenue">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              MRR this month
            </p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="num text-[34px] font-medium" style={{ color: "var(--text)" }}>
                {formatMoney(mrr)}
              </span>
              <Badge color={deltaColor}>{deltaLabel}</Badge>
            </div>
          </div>
          <p className="text-xs num" style={{ color: "var(--text-faint)" }}>
            {mrrLastUpdated
              ? `as of ${format(new Date(mrrLastUpdated), "MMM d")}`
              : "no income logged yet"}
          </p>
        </div>
      </Card>

      {/* 3. Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card>
          <p className="text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Projects Active
          </p>
          <p className="num text-[26px] font-medium mt-3" style={{ color: "var(--text)" }}>
            {activeProjects.length}
          </p>
        </Card>
        <Card>
          <p className="text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Content Pieces
          </p>
          <p className="num text-[26px] font-medium mt-3" style={{ color: "var(--text)" }}>
            {contentPieceCount ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-[11.5px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Money This Month
          </p>
          <p
            className="num text-[26px] font-medium mt-3"
            style={{ color: moneyThisMonth >= 0 ? "#00d294" : "#ff6568" }}
          >
            {formatMoney(moneyThisMonth)}
          </p>
        </Card>
      </div>

      {/* 4. Today's wins */}
      <Card title="Today's Wins">
        <textarea
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          placeholder="What went well today?"
          rows={4}
          className="w-full resize-y rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
          }}
        />
        <div className="mt-3 flex items-center gap-3">
          <button className="btn btn-primary" onClick={handleSaveWins}>
            Save
          </button>
          {winsSaved && (
            <span className="text-xs" style={{ color: "#00d294" }}>
              Saved
            </span>
          )}
        </div>
      </Card>

      {/* existing: active projects + AI coach + calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Active Projects" className="lg:col-span-2">
          {activeProjects.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-faint)" }}>
              Nothing in progress right now.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeProjects.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
                      {p.name || "(untitled)"}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.priority && (
                        <Badge color={PRIORITY_COLOR[p.priority] ?? "neutral"}>
                          {p.priority.replace(" Priority", "")}
                        </Badge>
                      )}
                      <span className="num text-xs" style={{ color: "var(--text-faint)" }}>
                        {STATUS_PROGRESS[p.status ?? "Inbox"]}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${STATUS_PROGRESS[p.status ?? "Inbox"]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card
            title="AI Coach"
            style={{
              borderColor: "rgba(0, 210, 148, 0.22)",
              background:
                "linear-gradient(165deg, rgba(0, 210, 148, 0.09), var(--bg-elevated) 60%)",
            }}
          >
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: "var(--text)" }}>
              Not connected yet — once AI Coach is wired up, nudges about
              stalled projects and daily focus will show up here.
            </p>
            <button className="btn btn-ghost w-full justify-center" onClick={onOpenAiCoach}>
              Open AI Coach
            </button>
          </Card>

          <Card title="Today's Calendar">
            {events.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                No events today.
              </p>
            ) : (
              <ul className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="text-sm">
                    <div style={{ color: "var(--text)" }}>{e.summary}</div>
                    <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {e.allDay ? "All day" : `${formatTime(e.start)} – ${formatTime(e.end)}`}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
