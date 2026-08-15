"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { fos } from "@/lib/fos";
import { DEFAULT_HEALTH_TARGETS, HEALTH_TARGETS_KEY, type HealthTargets } from "@/lib/health-targets";

function fieldStyle(): React.CSSProperties {
  return {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };
}

export function SettingsPanel() {
  const [hydrated, setHydrated] = useState(false);

  const [name, setName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  const [targets, setTargets] = useState<HealthTargets>(DEFAULT_HEALTH_TARGETS);
  const [targetsSaved, setTargetsSaved] = useState(false);

  const [resetArmed, setResetArmed] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(fos.get<string>("founderName", ""));
    setTargets(fos.get<HealthTargets>(HEALTH_TARGETS_KEY, DEFAULT_HEALTH_TARGETS));
    setHydrated(true);
  }, []);

  function handleSaveName() {
    fos.set("founderName", name.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1800);
  }

  function handleSaveTargets() {
    fos.set(HEALTH_TARGETS_KEY, targets);
    setTargetsSaved(true);
    setTimeout(() => setTargetsSaved(false), 1800);
  }

  function handleExport() {
    const data = fos.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    fos.clearAll();
    setName("");
    setTargets(DEFAULT_HEALTH_TARGETS);
    setResetArmed(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <Card title="Profile">
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
          Shows up in the Dashboard greeting.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="founder-name-input"
            >
              Your name
            </label>
            <input
              id="founder-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Founder"
              className="w-full rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
              style={fieldStyle()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSaveName}>
            Save
          </button>
          {nameSaved && (
            <span className="text-xs" style={{ color: "#00d294" }}>
              Saved
            </span>
          )}
        </div>
      </Card>

      <Card title="Health Targets">
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
          Daily goals used by the progress rings on Health &amp; Fitness.
        </p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="target-calories"
            >
              Calories
            </label>
            <input
              id="target-calories"
              type="number"
              min={0}
              value={targets.calories}
              onChange={(e) => setTargets({ ...targets, calories: Number(e.target.value) })}
              className="w-32 rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
              style={fieldStyle()}
            />
          </div>
          <div>
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="target-protein"
            >
              Protein (g)
            </label>
            <input
              id="target-protein"
              type="number"
              min={0}
              value={targets.protein}
              onChange={(e) => setTargets({ ...targets, protein: Number(e.target.value) })}
              className="w-32 rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
              style={fieldStyle()}
            />
          </div>
          <div>
            <label
              className="block text-[11.5px] uppercase tracking-wide mb-1.5"
              style={{ color: "var(--text-faint)" }}
              htmlFor="target-water"
            >
              Water (ml)
            </label>
            <input
              id="target-water"
              type="number"
              min={0}
              value={targets.water}
              onChange={(e) => setTargets({ ...targets, water: Number(e.target.value) })}
              className="w-32 rounded-lg px-3.5 py-2.5 text-[14px] outline-none"
              style={fieldStyle()}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button className="btn btn-primary" onClick={handleSaveTargets}>
            Save
          </button>
          {targetsSaved && (
            <span className="text-xs" style={{ color: "#00d294" }}>
              Saved
            </span>
          )}
        </div>
      </Card>

      <Card title="Local Data">
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
          Everything Founder OS remembers between visits — North Star Focus,
          Today&apos;s Wins, AI Coach history, Content Studio drafts, and these
          settings — lives only in this browser&apos;s localStorage. Nothing is
          synced anywhere else.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-ghost" onClick={handleExport}>
            Export backup (.json)
          </button>
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
