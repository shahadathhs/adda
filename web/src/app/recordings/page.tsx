import type { Metadata } from "next";
import { Suspense } from "react";
import { RecordingBrowser } from "@/components/browse/recording-browser";

export const metadata: Metadata = { title: "Recordings" };

export default function Page() {
  return (
    <main>
      <Suspense>
        <RecordingBrowser />
      </Suspense>
    </main>
  );
}
