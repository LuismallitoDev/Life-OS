"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RotateCw } from "lucide-react";
import { Card } from "@/components/ui";
import { SetupNotice } from "@/components/setup-notice";

const REMOTION_URL = "http://localhost:3001";

type Status = "checking" | "up" | "down";

export function RemotionEmbed() {
  const [status, setStatus] = useState<Status>("checking");

  function probe() {
    fetch(REMOTION_URL, { mode: "no-cors", signal: AbortSignal.timeout(2500) })
      .then(() => setStatus("up"))
      .catch(() => setStatus("down"));
  }

  useEffect(() => {
    // Reaching outside the app to check a local dev server is exactly the
    // kind of external-system sync an effect is for.
    probe();
  }, []);

  function retry() {
    setStatus("checking");
    probe();
  }

  return (
    <Card title="Video Editor">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>
          Remotion Studio, embedded from a local project at{" "}
          <code className="num">remotion-studio/</code>.
        </p>
        <a
          href={REMOTION_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs shrink-0"
          style={{ color: "var(--text-faint)" }}
        >
          Open in new tab
          <ExternalLink size={12} />
        </a>
      </div>

      {status === "down" && (
        <SetupNotice>
          <div className="flex items-center justify-between gap-3">
            <span>
              Remotion Studio isn&apos;t running. Start it with{" "}
              <code className="num">cd remotion-studio &amp;&amp; npm run dev</code>,
              then retry.
            </span>
            <button
              onClick={retry}
              className="flex items-center gap-1.5 text-xs shrink-0 underline underline-offset-2"
              style={{ color: "inherit" }}
            >
              <RotateCw size={12} />
              Retry
            </button>
          </div>
        </SetupNotice>
      )}

      {status === "checking" && (
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Checking for Remotion Studio on port 3001…
        </p>
      )}

      {status === "up" && (
        <iframe
          src={REMOTION_URL}
          title="Remotion Studio"
          className="w-full rounded-lg"
          style={{ height: "780px", border: "1px solid var(--border)" }}
          allow="clipboard-write"
        />
      )}
    </Card>
  );
}
