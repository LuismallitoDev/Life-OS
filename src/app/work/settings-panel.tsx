"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { fos } from "@/lib/fos";

function maskKey(key: string) {
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

function fieldStyle(): React.CSSProperties {
  return {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };
}

export function SettingsPanel() {
  const [hydrated, setHydrated] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedKey(fos.get<string>("anthropic_key", ""));
    setHydrated(true);
  }, []);

  function handleSaveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    fos.set("anthropic_key", trimmed);
    setSavedKey(trimmed);
    setKeyInput("");
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 1800);
  }

  function handleRemoveKey() {
    fos.remove("anthropic_key");
    setSavedKey("");
  }

  function handleReset() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    fos.clearAll();
    setSavedKey("");
    setResetArmed(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <Card title="Anthropic API Key">
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
          Used by AI Coach and Content Studio. Stored only in this browser&apos;s
          localStorage — never sent anywhere except directly to Anthropic&apos;s API.
        </p>

        {savedKey && (
          <div
            className="flex items-center justify-between rounded-lg px-3.5 py-2.5 mb-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <span className="num text-[13px]" style={{ color: "var(--text)" }}>
              {maskKey(savedKey)}
            </span>
            <button className="btn btn-ghost" onClick={handleRemoveKey}>
              Remove
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[240px]">
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="anthropic-key-input"
            >
              {savedKey ? "Replace key" : "API key"}
            </label>
            <input
              id="anthropic-key-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
              className="w-full rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
              style={fieldStyle()}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveKey}
            disabled={!keyInput.trim()}
            style={{ opacity: keyInput.trim() ? 1 : 0.5 }}
          >
            Save
          </button>
          {keySaved && (
            <span className="text-xs" style={{ color: "#00d294" }}>
              Saved
            </span>
          )}
        </div>
      </Card>

      <Card title="Local Data">
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
          Everything Founder OS remembers between visits — North Star Focus,
          Today&apos;s Wins, AI Coach history, Content Studio drafts, and this
          API key — lives only in this browser&apos;s localStorage. Nothing is
          synced anywhere else.
        </p>
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost"
            onClick={handleReset}
            style={resetArmed ? { borderColor: "#ff6568", color: "#ff6568" } : undefined}
          >
            {resetArmed ? "Click again to confirm — this can't be undone" : "Reset all local data"}
          </button>
          {resetArmed && (
            <button className="btn btn-ghost" onClick={() => setResetArmed(false)}>
              Cancel
            </button>
          )}
          {resetDone && (
            <span className="text-xs" style={{ color: "#00d294" }}>
              Cleared
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
