import { Card } from "@/components/ui";

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-[34px] text-[var(--text)]">Tools</h1>
      <Card>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Nothing here yet — this is where embedded/connected tools (Gmail, extra
          Notion views, etc.) will live once they&apos;re wired up.
        </p>
      </Card>
    </div>
  );
}
