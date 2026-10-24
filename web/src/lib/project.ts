/** Facts about the project, shown on the About page and in the footer. */
export const PROJECT = {
  name: "adda",
  repo: "https://github.com/shahadathhs/adda",
  issues: "https://github.com/shahadathhs/adda/issues",
  license: "https://github.com/shahadathhs/adda/blob/dev/LICENSE",
  docs: "https://github.com/shahadathhs/adda/blob/dev/docs/OPERATIONS.md",
  author: { handle: "shahadathhs", url: "https://github.com/shahadathhs" },
  /** The marketing and docs site, once it is deployed (set NEXT_PUBLIC_SITE_URL when building). */
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "",
} as const;
