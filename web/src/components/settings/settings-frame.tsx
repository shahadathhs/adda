import { RequireAuth } from "@/components/app-shell";
import { RouteTabs } from "@/components/ui/route-tabs";

const TABS = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/password", label: "Password" },
];

/** Account chrome: title, section tabs, then the page, the same shape as the studio. */
export function SettingsFrame({
  children,
  current,
}: {
  children: React.ReactNode;
  current?: string;
}) {
  return (
    <RequireAuth>
      <div className="px-4 py-7 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Account
        </p>
        <h1 className="mt-0.5 font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
          Settings
        </h1>
        <div className="mb-6 mt-4">
          <RouteTabs label="Settings sections" tabs={TABS} current={current} />
        </div>
        <main>{children}</main>
      </div>
    </RequireAuth>
  );
}
