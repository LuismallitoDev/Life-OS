export function Card({
  title,
  children,
  className = "",
  style,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card-surface p-5 ${className}`} style={style}>
      {title && (
        <h2
          className="mb-4 text-[15px] font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "neutral",
}: {
  children: React.ReactNode;
  color?: "neutral" | "green" | "blue" | "yellow" | "red" | "purple";
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    neutral: { bg: "var(--surface-active)", text: "var(--text-dim)" },
    green: { bg: "var(--accent-dim)", text: "var(--accent)" },
    blue: { bg: "rgba(48, 128, 255, 0.14)", text: "#3080ff" },
    yellow: { bg: "rgba(249, 156, 0, 0.14)", text: "#f99c00" },
    red: { bg: "rgba(255, 101, 104, 0.12)", text: "#ff6568" },
    purple: { bg: "rgba(144, 197, 255, 0.14)", text: "#90c5ff" },
  };
  const c = colors[color];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.text, fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-track">
      <div
        className={color ? "" : "progress-fill"}
        style={{
          height: "100%",
          borderRadius: "3px",
          width: `${pct}%`,
          background: color,
        }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  max,
  label,
  color = "var(--accent)",
  size = 96,
}: {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-strong)"
          strokeWidth={8}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center">
        <div className="text-sm font-semibold num" style={{ color: "var(--text)" }}>
          {Math.round(value)} / {Math.round(max)}
        </div>
        <div className="text-xs" style={{ color: "var(--text-faint)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
