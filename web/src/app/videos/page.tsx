import type { Metadata } from "next";
import { Suspense } from "react";
import { VideoBrowser } from "@/components/browse/video-browser";

export const metadata: Metadata = { title: "Videos" };

export default function Page() {
  return (
    <main>
      <Suspense>
        <VideoBrowser />
      </Suspense>
    </main>
  );
}
