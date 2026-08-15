"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import { fos } from "@/lib/fos";
import { askCoach, CoachError, type CoachMessage } from "@/lib/ai-coach";

const SESSIONS_KEY = "coachSessions";
const ACTIVE_SESSION_KEY = "coachActiveSessionId";
const LEGACY_HISTORY_KEY = "coachHistory"; // pre-sessions flat history, migrated once

type CoachSession = {
  id: string;
  title: string;
  messages: CoachMessage[];
  createdAt: string;
  updatedAt: string;
};

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cs_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function titleFrom(message: string) {
  const trimmed = message.trim().replace(/\s+/g, " ");
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

export function AiCoachPanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [streaming, setStreaming] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    const key = fos.get<string>("anthropic_key", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(key || null);

    let loadedSessions = fos.get<CoachSession[]>(SESSIONS_KEY, []);

    // One-time migration from the old flat-history version of AI Coach.
    if (loadedSessions.length === 0) {
      const legacy = fos.get<CoachMessage[]>(LEGACY_HISTORY_KEY, []);
      if (legacy.length > 0) {
        const now = new Date().toISOString();
        const migrated: CoachSession = {
          id: newId(),
          title: titleFrom(legacy[0].content) || "Previous chat",
          messages: legacy,
          createdAt: now,
          updatedAt: now,
        };
        loadedSessions = [migrated];
        fos.set(SESSIONS_KEY, loadedSessions);
        fos.remove(LEGACY_HISTORY_KEY);
      }
    }

    setSessions(loadedSessions);
    const savedActiveId = fos.get<string | null>(ACTIVE_SESSION_KEY, null);
    setActiveId(loadedSessions.some((s) => s.id === savedActiveId) ? savedActiveId : null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeId, streaming]);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;
  const messages = activeSession?.messages ?? [];

  function persistSessions(next: CoachSession[]) {
    setSessions(next);
    fos.set(SESSIONS_KEY, next);
  }

  function selectSession(id: string | null) {
    setActiveId(id);
    fos.set(ACTIVE_SESSION_KEY, id);
  }

  function handleNewChat() {
    selectSession(null);
    setQuestion("");
    setError(null);
  }

  function handleDeleteSession(id: string) {
    const next = sessions.filter((s) => s.id !== id);
    persistSessions(next);
    if (activeId === id) selectSession(null);
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || !apiKey || isAsking) return;

    setError(null);
    setIsAsking(true);
    setStreaming("");
    setQuestion("");

    const priorMessages = activeSession?.messages ?? [];

    let full = "";
    try {
      full = await askCoach(q, priorMessages, apiKey, (chunk) => {
        setStreaming((prev) => prev + chunk);
      });
    } catch (err) {
      setError(err instanceof CoachError ? err.message : "Something went wrong. Try again.");
      setIsAsking(false);
      setStreaming("");
      return;
    }

    const now = new Date().toISOString();
    const updatedMessages: CoachMessage[] = [
      ...priorMessages,
      { role: "user", content: q },
      { role: "assistant", content: full },
    ];

    let nextSessions: CoachSession[];
    let sessionId: string;
    if (activeSession) {
      sessionId = activeSession.id;
      nextSessions = sessions.map((s) =>
        s.id === activeSession.id ? { ...s, messages: updatedMessages, updatedAt: now } : s
      );
    } else {
      sessionId = newId();
      const created: CoachSession = {
        id: sessionId,
        title: titleFrom(q),
        messages: updatedMessages,
        createdAt: now,
        updatedAt: now,
      };
      nextSessions = [created, ...sessions];
    }

    persistSessions(nextSessions);
    selectSession(sessionId);
    setStreaming("");
    setIsAsking(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  if (!hydrated) return null;

  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      {!apiKey && (
        <SetupNotice>
          Add your API key in{" "}
          <button
            onClick={onOpenSettings}
            className="underline underline-offset-2"
            style={{ color: "inherit" }}
          >
            Settings
          </button>
          .
        </SetupNotice>
      )}
      {error && <SetupNotice>{error}</SetupNotice>}

      <div className="flex gap-4 items-start">
        {/* Session sidebar */}
        <div
          className="w-56 shrink-0 rounded-2xl p-2 flex flex-col gap-1"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            height: "560px",
          }}
        >
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium mb-1"
            style={{ background: "var(--surface-active)", color: "var(--text)" }}
          >
            <Plus size={14} />
            New chat
          </button>
          <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
            {sortedSessions.length === 0 && (
              <p className="text-xs px-3 py-2" style={{ color: "var(--text-faint)" }}>
                No chats yet.
              </p>
            )}
            {sortedSessions.map((s) => {
              const isActive = s.id === activeId;
              return (
                <div
                  key={s.id}
                  className="group flex items-center gap-1 rounded-lg pl-3 pr-1 py-2 cursor-pointer"
                  style={{ background: isActive ? "var(--surface-active)" : "transparent" }}
                  onClick={() => selectSession(s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12.5px] truncate"
                      style={{ color: isActive ? "var(--text)" : "var(--text-dim)" }}
                    >
                      {s.title || "New chat"}
                    </p>
                    <p className="text-[10.5px] num" style={{ color: "var(--text-faint)" }}>
                      {format(new Date(s.updatedAt), "MMM d")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 shrink-0"
                    style={{ color: "var(--text-faint)" }}
                    aria-label="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation */}
        <Card className="flex-1 flex flex-col" style={{ height: "560px" }}>
          <div ref={scrollRef} className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1">
            {messages.length === 0 && !streaming && (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Ask the coach something — a stuck decision, a plan you want pressure-tested,
                a win you shipped today.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span
                  className="text-[10.5px] uppercase tracking-wide"
                  style={{ color: "var(--text-faint)" }}
                >
                  {m.role === "user" ? "You" : "Coach"}
                </span>
                <p
                  className="text-[13.5px] leading-relaxed whitespace-pre-wrap"
                  style={{ color: m.role === "user" ? "var(--text-dim)" : "var(--text)" }}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {isAsking && (
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10.5px] uppercase tracking-wide"
                  style={{ color: "var(--accent)" }}
                >
                  Coach
                </span>
                {streaming ? (
                  <p
                    className="text-[13.5px] leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text)" }}
                  >
                    {streaming}
                    <span className="typing-caret" />
                  </p>
                ) : (
                  <div className="flex gap-1 py-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                    <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 items-end border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={apiKey ? "What's on your mind?" : "Add an API key in Settings to ask the coach"}
              disabled={!apiKey || isAsking}
              rows={2}
              className="flex-1 resize-none rounded-lg px-3.5 py-2.5 text-[14px] outline-none disabled:opacity-50"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAsk}
              disabled={!apiKey || !question.trim() || isAsking}
              style={{ opacity: !apiKey || !question.trim() || isAsking ? 0.5 : 1 }}
            >
              Ask Coach
            </button>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-faint);
          animation: typing-bounce 1s infinite ease-in-out;
        }
        .typing-caret {
          display: inline-block;
          width: 2px;
          height: 13px;
          margin-left: 2px;
          background: var(--accent);
          vertical-align: text-bottom;
          animation: typing-blink 0.9s steps(1) infinite;
        }
        @keyframes typing-bounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }
        @keyframes typing-blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
