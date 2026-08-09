import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";

export const Route = createFileRoute("/register")({
  head: () => ({
    title: "Create account — adda",
    meta: [
      {
        name: "description",
        content: "Join adda and start your community.",
      },
      { property: "og:title", content: "Create account — adda" },
      { property: "og:description", content: "Join adda and start your community." },
    ],
  }),
  component: () => <LoginPage initialMode="register" />,
});
