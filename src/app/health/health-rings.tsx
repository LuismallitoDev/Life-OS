"use client";

import { useEffect, useState } from "react";
import { ProgressRing } from "@/components/ui";
import { fos } from "@/lib/fos";
import { DEFAULT_HEALTH_TARGETS, HEALTH_TARGETS_KEY, type HealthTargets } from "@/lib/health-targets";

export function HealthRings({
  totals,
}: {
  totals: { calories: number; protein: number; water: number };
}) {
  const [targets, setTargets] = useState<HealthTargets>(DEFAULT_HEALTH_TARGETS);

  useEffect(() => {
    // Hydrate from localStorage — an external system unavailable during SSR,
    // so this can only happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTargets(fos.get<HealthTargets>(HEALTH_TARGETS_KEY, DEFAULT_HEALTH_TARGETS));
  }, []);

  return (
    <div className="flex flex-wrap gap-8 justify-around py-2">
      <ProgressRing value={totals.calories} max={targets.calories} label="Calories" color="#f99c00" />
      <ProgressRing value={totals.protein} max={targets.protein} label="Protein (g)" color="#00d294" />
      <ProgressRing value={totals.water} max={targets.water} label="Water (ml)" color="#3080ff" />
    </div>
  );
}
