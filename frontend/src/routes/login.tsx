import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    title: "Log in — adda",
    meta: [
      { name: "description", content: "Sign in to your adda account." },
      { property: "og:title", content: "Log in — adda" },
      { property: "og:description", content: "Sign in to your adda account." },
    ],
  }),
  component: () => <LoginPage initialMode="login" />,
});
