import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://adda.example.com",
  integrations: [
    starlight({
      title: "adda",
      description:
        "Self-hosted live streaming with realtime chat and automatic recordings — one Docker Compose stack, all in the browser.",
      favicon: "/favicon.svg",
      logo: {
        src: "./src/assets/logo.svg",
      },
      customCss: ["./src/styles/theme.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/shahadathhs/adda",
        },
      ],
      sidebar: [
        {
          label: "Start",
          items: [
            { label: "Quickstart", link: "/quickstart/" },
            { label: "FAQ", link: "/faq/" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Self-hosting", link: "/guides/self-hosting/" },
            { label: "Going live (OBS)", link: "/guides/streaming/" },
            { label: "Administration", link: "/guides/admin/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Configuration", link: "/reference/configuration/" },
            { label: "API overview", link: "/reference/api/" },
          ],
        },
      ],
    }),
  ],
});
