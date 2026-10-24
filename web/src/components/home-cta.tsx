"use client";

import Link from "next/link";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";

export function HomeCta() {
  const { data: user } = useMe();
  return (
    <section className="rounded-lg border border-border bg-card/40 px-6 py-12 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Own your stage
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Create a channel, paste your stream URL into OBS, and you&apos;re live — with chat,
        followers, and recordings included.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href={user ? "/studio" : "/register"}>
          <Button variant="primary" size="lg">
            {user ? "Go to Studio" : "Get started"}
          </Button>
        </Link>
      </div>
    </section>
  );
}
