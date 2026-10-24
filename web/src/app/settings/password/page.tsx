import { redirect } from "next/navigation";

// Password lives on the profile tab now; keep old links working.
export default function PasswordSettingsPage() {
  redirect("/settings");
}
