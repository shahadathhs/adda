import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@/components/search/search-page";

export const metadata: Metadata = { title: "Search" };

export default function Page() {
  return (
    <main>
      <Suspense>
        <SearchPage />
      </Suspense>
    </main>
  );
}
