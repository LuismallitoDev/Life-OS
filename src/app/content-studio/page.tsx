import { ContentStudioTabs } from "./content-studio-tabs";

export default function ContentStudioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-[34px] text-[var(--text)]">Content Studio</h1>
      <ContentStudioTabs />
    </div>
  );
}
