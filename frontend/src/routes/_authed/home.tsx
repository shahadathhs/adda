import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/pages/HomePage";

export const Route = createFileRoute("/_authed/home")({
  head: () => ({
    title: "Communities — adda",
    meta: [
      { name: "description", content: "Browse and join communities on adda." },
      { property: "og:title", content: "Communities — adda" },
      { property: "og:description", content: "Browse and join communities on adda." },
    ],
  }),
  component: HomePage,
});
