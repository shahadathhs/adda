"use client";

import { useRouter } from "next/navigation";
import { CreateChannelForm } from "@/components/home/create-channel-form";

/** Studio for an account with no channel yet: name one to get started. */
export function NoChannel() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-[28px] font-bold leading-8 tracking-tight text-foreground">
        Create your channel
      </h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">
        A channel is your page, your stream key and your chat. You can change the details later.
      </p>
      <CreateChannelForm onDone={() => router.refresh()} />
    </div>
  );
}
