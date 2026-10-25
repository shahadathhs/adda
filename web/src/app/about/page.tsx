import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";

export const metadata: Metadata = {
  title: "About",
  description: "What adda is, who builds it, and where to find the source and the docs.",
};

export default function Page() {
  return (
    <main>
      <AboutPage />
    </main>
  );
}
