/**
 * Native notifications: Tauri plugin inside the desktop shell, Web
 * Notification API when previewing in a browser.
 */

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let permission: "granted" | "denied" | "default" | "unknown" = "unknown";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (isTauri) {
    const { isPermissionGranted, requestPermission } =
      await import("@tauri-apps/plugin-notification");
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    permission = granted ? "granted" : "denied";
    return granted;
  }
  if (typeof Notification !== "undefined") {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    permission = Notification.permission as typeof permission;
    return Notification.permission === "granted";
  }
  return false;
}

export async function notify(title: string, body: string): Promise<void> {
  if (permission === "unknown" || permission === "default") {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
  }
  if (permission !== "granted") return;

  if (isTauri) {
    const { sendNotification } = await import("@tauri-apps/plugin-notification");
    sendNotification({ title, body });
  } else {
    new Notification(title, { body });
  }
}
