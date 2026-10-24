import type { Metadata } from "next";
import { Suspense } from "react";
import { ChannelBrowser } from "@/components/browse/channel-browser";

export const metadata: Metadata = { title: "All channels" };

export default function Page() {
  return (
    <main>
      <Suspense>
        <ChannelBrowser />
      </Suspense>
    </main>
  );
}
