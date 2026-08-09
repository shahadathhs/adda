import { createFileRoute } from "@tanstack/react-router";
import CommunityPage from "@/pages/CommunityPage";

export const Route = createFileRoute("/_authed/community/$id")({
  head: () => ({
    title: "Community — adda",
    meta: [
      {
        name: "description",
        content: "Join the conversation, watch live, and connect.",
      },
      { property: "og:title", content: "Community — adda" },
      {
        property: "og:description",
        content: "Join the conversation, watch live, and connect.",
      },
    ],
  }),
  component: CommunityPage,
});
