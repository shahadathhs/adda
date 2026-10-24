/** The docs sidebar: sections in reading order. Slugs match files under content/docs. */
export const DOCS_NAV: { label: string; items: { label: string; slug: string }[] }[] = [
  {
    label: "Start",
    items: [
      { label: "Quickstart", slug: "quickstart" },
      { label: "FAQ", slug: "faq" },
    ],
  },
  {
    label: "Guides",
    items: [
      { label: "Going live with OBS", slug: "guides/streaming" },
      { label: "Chat and moderation", slug: "guides/chat-and-moderation" },
      { label: "Your channel page", slug: "guides/channel-page" },
      { label: "Administration", slug: "guides/admin" },
    ],
  },
  {
    label: "Run a server",
    items: [
      { label: "Self-hosting", slug: "guides/self-hosting" },
      { label: "Operations", slug: "operations" },
      { label: "Architecture", slug: "architecture" },
    ],
  },
  {
    label: "Reference",
    items: [
      { label: "Configuration", slug: "reference/configuration" },
      { label: "API overview", slug: "reference/api" },
      { label: "Chat and realtime protocol", slug: "chat" },
    ],
  },
];

export const DOCS_ORDER = DOCS_NAV.flatMap((s) => s.items.map((i) => i.slug));
