import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

interface RouterContext {
  queryClient: QueryClient;
}

const SITE_NAME = "adda";
const SITE_DESC =
  "Self-hosted community platform with live streaming. Telegram Channels meets Discord meets Twitch — in one deployable bundle.";
const DEFAULT_OG = "/logo.svg";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "description", content: SITE_DESC },
      {
        name: "keywords",
        content:
          "adda, community platform, live streaming, self-hosted, discord alternative, telegram channels",
      },
      { name: "author", content: "adda" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:title", content: `${SITE_NAME} — Communities that happen to stream` },
      { property: "og:description", content: SITE_DESC },
      { property: "og:image", content: DEFAULT_OG },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${SITE_NAME} — Communities that happen to stream` },
      { name: "twitter:description", content: SITE_DESC },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/logo.svg" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      404 — page not found
    </div>
  ),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  );
}
