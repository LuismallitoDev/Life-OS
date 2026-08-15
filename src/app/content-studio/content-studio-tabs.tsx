"use client";

import { useEffect, useState } from "react";
import { Sparkles, Clapperboard } from "lucide-react";
import { fos } from "@/lib/fos";
import { ContentStudioPanel } from "./content-studio-panel";
import { RemotionEmbed } from "./remotion-embed";

const TAB_KEY = "contentStudioTab";

const TABS = [
  { id: "ai-automation", label: "AI Automation", icon: Sparkles },
  { id: "remotion", label: "Remotion", icon: Clapperboard },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ContentStudioTabs() {
  const [active, setActive] = useState<TabId>("ai-automation");

  useEffect(() => {
    // Restore the last tab from localStorage — an external system that
    // isn't available during SSR, so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(fos.get<TabId>(TAB_KEY, "ai-automation"));
  }, []);

  function navigate(id: TabId) {
    setActive(id);
    fos.set(TAB_KEY, id);
  }

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-1 rounded-xl p-1 w-fit"
        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
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

      {active === "ai-automation" && <ContentStudioPanel />}
      {active === "remotion" && <RemotionEmbed />}
    </div>
  );
}
