"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Community } from "@/lib/types";

/** Pick which of your channels the studio is showing. */
export function ChannelSwitcher({ channels, current }: { channels: Community[]; current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="mt-2">
      <label htmlFor="studio-channel" className="sr-only">
        Channel
      </label>
      <select
        id="studio-channel"
        value={current}
        onChange={(e) => router.push(`${pathname}?channel=${e.target.value}`)}
        className="h-8 rounded-sm border border-input bg-input/50 px-2 text-sm text-foreground"
      >
        {channels.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
