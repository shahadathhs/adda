const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://getadda.vercel.app";

/** Facts about the project, shown on the About page and in the footer. */
export const PROJECT = {
  name: "adda",
  /** The marketing and docs site. Set NEXT_PUBLIC_SITE_URL when building to point elsewhere. */
  site: SITE,
  docs: `${SITE}/docs/operations`,
  repo: "https://github.com/shahadathhs/adda",
  issues: "https://github.com/shahadathhs/adda/issues",
  license: "https://github.com/shahadathhs/adda/blob/main/LICENSE",
  author: { handle: "shahadathhs", url: "https://github.com/shahadathhs" },
} as const;
