import { RequireAuth } from "@/components/app-shell";
import { SettingsNav } from "@/components/settings/settings-nav";

/** Title, section nav and content column shared by every settings page. */
export function SettingsFrame({
  children,
  current,
}: {
  children: React.ReactNode;
  current?: string;
}) {
  return (
    <RequireAuth>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12">
        <div className="lg:w-[200px] lg:shrink-0">
          <h1 className="mb-4 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
            Settings
          </h1>
          <SettingsNav current={current} />
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </RequireAuth>
  );
}
