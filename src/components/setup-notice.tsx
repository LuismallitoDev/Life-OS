import { AlertTriangle } from "lucide-react";

export function SetupNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
      style={{
        border: "1px solid rgba(249, 156, 0, 0.25)",
        background: "rgba(249, 156, 0, 0.08)",
        color: "#f99c00",
        borderRadius: "var(--radius-md)",
      }}
    >
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
