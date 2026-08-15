import { SettingsPanel } from "./settings-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-[34px] text-[var(--text)]">Settings</h1>
      <SettingsPanel />
    </div>
  );
}
