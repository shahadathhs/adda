import { NotificationPrefsForm } from "@/components/settings/notification-prefs";

export default function NotificationSettingsPage() {
  return (
    <section aria-labelledby="notif-heading">
      <h2
        id="notif-heading"
        className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground"
      >
        Notifications
      </h2>
      <NotificationPrefsForm />
    </section>
  );
}
