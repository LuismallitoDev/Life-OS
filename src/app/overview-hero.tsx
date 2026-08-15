"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fos } from "@/lib/fos";

export function OverviewHero() {
  const [greeting, setGreeting] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    const now = new Date();
    const name = fos.get<string>("founderName", "").trim();
    const part = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(name ? `${part}, ${name}.` : `${part}.`);
    setDateLabel(format(now, "EEEE, MMMM d"));
  }, []);

  return (
    <div>
      <h1
        className="text-[28px]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--text)" }}
      >
        {greeting || " "}
      </h1>
      <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
        {dateLabel || " "}
      </p>
    </div>
  );
}
