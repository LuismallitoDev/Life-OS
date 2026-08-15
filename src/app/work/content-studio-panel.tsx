"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, Badge } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";
import { fos } from "@/lib/fos";
import {
  draftContent,
  ContentDraftError,
  type ContentDrafts,
} from "@/lib/content-drafter";

const STORAGE_KEY = "contentPieces";

const STAGES = ["Research", "Idea", "Scripting", "Filming/Editing", "Scheduled"] as const;
type ContentStage = (typeof STAGES)[number];

const STAGE_COLOR: Record<ContentStage, "neutral" | "yellow" | "blue" | "purple" | "green"> = {
  Research: "neutral",
  Idea: "yellow",
  Scripting: "blue",
  "Filming/Editing": "purple",
  Scheduled: "green",
};

type ContentPiece = {
  id: string;
  topic: string;
  researchNotes: string;
  stage: ContentStage;
  drafts: ContentDrafts;
  createdAt: string;
};

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function fieldStyle(): React.CSSProperties {
  return {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };
}

export function ContentStudioPanel({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pieces, setPieces] = useState<ContentPiece[]>([]);

  const [topic, setTopic] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentDrafts | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    const key = fos.get<string>("anthropic_key", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(key || null);
    setPieces(fos.get<ContentPiece[]>(STORAGE_KEY, []));
    setHydrated(true);
  }, []);

  function persistPieces(next: ContentPiece[]) {
    setPieces(next);
    fos.set(STORAGE_KEY, next);
  }

  async function handleDraft() {
    const t = topic.trim();
    if (!t || !apiKey || isDrafting) return;

    setError(null);
    setIsDrafting(true);
    setDraft(null);

    try {
      const result = await draftContent(t, researchNotes, apiKey);
      setDraft(result);
    } catch (err) {
      setError(err instanceof ContentDraftError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsDrafting(false);
    }
  }

  function handleSave() {
    if (!draft) return;
    const piece: ContentPiece = {
      id: newId(),
      topic: topic.trim(),
      researchNotes: researchNotes.trim(),
      stage: "Scripting",
      drafts: draft,
      createdAt: new Date().toISOString(),
    };
    persistPieces([piece, ...pieces]);
    setDraft(null);
    setTopic("");
    setResearchNotes("");
  }

  function updateStage(id: string, stage: ContentStage) {
    persistPieces(pieces.map((p) => (p.id === id ? { ...p, stage } : p)));
  }

  if (!hydrated) return null;

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
          </button>{" "}
          to draft content.
        </SetupNotice>
      )}
      {error && <SetupNotice>{error}</SetupNotice>}

      <Card title="Draft New Content">
        <div className="space-y-3">
          <div>
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="content-topic"
            >
              Topic
            </label>
            <input
              id="content-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What's the video/post about?"
              disabled={!apiKey || isDrafting}
              className="w-full rounded-lg px-3.5 py-2.5 text-[14.5px] outline-none disabled:opacity-50"
              style={fieldStyle()}
            />
          </div>
          <div>
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="content-research"
            >
              Research notes (optional)
            </label>
            <textarea
              id="content-research"
              value={researchNotes}
              onChange={(e) => setResearchNotes(e.target.value)}
              placeholder="Links, data, angles, quotes — anything worth feeding the draft"
              rows={3}
              disabled={!apiKey || isDrafting}
              className="w-full resize-y rounded-lg px-3.5 py-2.5 text-[14px] outline-none disabled:opacity-50"
              style={{ ...fieldStyle(), fontFamily: "var(--font-body)" }}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn btn-primary"
              onClick={handleDraft}
              disabled={!apiKey || !topic.trim() || isDrafting}
              style={{ opacity: !apiKey || !topic.trim() || isDrafting ? 0.5 : 1 }}
            >
              {isDrafting ? "Drafting…" : "Draft with AI"}
            </button>
            {isDrafting && (
              <div className="flex gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {draft && (
        <Card
          title="Drafts — edit before saving"
          style={{
            borderColor: "rgba(0, 210, 148, 0.22)",
            background: "linear-gradient(165deg, rgba(0, 210, 148, 0.08), var(--bg-elevated) 55%)",
          }}
        >
          <div className="space-y-4">
            <PlatformField
              label="YouTube — hook"
              value={draft.youtube.hook}
              onChange={(v) => setDraft({ ...draft, youtube: { ...draft.youtube, hook: v } })}
              rows={2}
            />
            <PlatformField
              label="YouTube — outline"
              value={draft.youtube.outline}
              onChange={(v) => setDraft({ ...draft, youtube: { ...draft.youtube, outline: v } })}
              rows={5}
            />
            <PlatformField
              label="Instagram — caption"
              value={draft.instagram.caption}
              onChange={(v) => setDraft({ ...draft, instagram: { caption: v } })}
              rows={4}
            />
            <PlatformField
              label="Facebook — post"
              value={draft.facebook.post}
              onChange={(v) => setDraft({ ...draft, facebook: { post: v } })}
              rows={4}
            />
            <PlatformField
              label="X — post"
              value={draft.x.post}
              onChange={(v) => setDraft({ ...draft, x: { post: v } })}
              rows={3}
            />
            <PlatformField
              label="TikTok — script"
              value={draft.tiktok.script}
              onChange={(v) => setDraft({ ...draft, tiktok: { script: v } })}
              rows={5}
            />
          </div>
          <button className="btn btn-primary mt-4" onClick={handleSave}>
            Save to Content Studio
          </button>
        </Card>
      )}

      <Card title="Saved Content">
        {pieces.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Nothing drafted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {pieces.map((p) => {
              const isOpen = expandedId === p.id;
              return (
                <div
                  key={p.id}
                  className="rounded-lg p-3.5"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      className="text-left flex-1 text-[13.5px] font-medium"
                      style={{ color: "var(--text)" }}
                      onClick={() => setExpandedId(isOpen ? null : p.id)}
                    >
                      {p.topic}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color={STAGE_COLOR[p.stage]}>{p.stage}</Badge>
                      <select
                        value={p.stage}
                        onChange={(e) => updateStage(p.id, e.target.value as ContentStage)}
                        className="text-xs rounded px-1.5 py-1 outline-none"
                        style={fieldStyle()}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs mt-1 num" style={{ color: "var(--text-faint)" }}>
                    {format(new Date(p.createdAt), "MMM d, yyyy")}
                  </p>

                  {isOpen && (
                    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                      <ReadField label="YouTube — hook" value={p.drafts.youtube.hook} />
                      <ReadField label="YouTube — outline" value={p.drafts.youtube.outline} />
                      <ReadField label="Instagram — caption" value={p.drafts.instagram.caption} />
                      <ReadField label="Facebook — post" value={p.drafts.facebook.post} />
                      <ReadField label="X — post" value={p.drafts.x.post} />
                      <ReadField label="TikTok — script" value={p.drafts.tiktok.script} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <style jsx>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-faint);
          animation: typing-bounce 1s infinite ease-in-out;
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
      `}</style>
    </div>
  );
}

function PlatformField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label
        className="block text-[11px] uppercase tracking-wide mb-1.5"
        style={{ color: "var(--accent)" }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-y rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
        style={{ ...fieldStyle(), fontFamily: "var(--font-body)" }}
      />
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--text-faint)" }}>
        {label}
      </p>
      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
        {value}
      </p>
    </div>
  );
}
