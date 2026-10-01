import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/pages/SettingsPage";

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({
    title: "Settings — adda",
    meta: [
      { name: "description", content: "Manage your adda account." },
      { property: "og:title", content: "Settings — adda" },
      { property: "og:description", content: "Manage your adda account." },
    ],
  }),
  component: SettingsPage,
});
