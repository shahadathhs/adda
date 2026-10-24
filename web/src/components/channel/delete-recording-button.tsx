"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteRecording } from "@/lib/api";
import { Button } from "@/components/ui/button";

/** The owner removes a recording for good, after confirming. */
export function DeleteRecordingButton({
  communityId,
  path,
  slug,
}: {
  communityId: string;
  path: string;
  slug: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteRecording(communityId, path),
    onSuccess: () => {
      toast.success("Recording deleted");
      void qc.invalidateQueries({ queryKey: ["recordings"] });
      router.push(`/channel/${slug}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete the recording"),
  });
  return (
    <Button
      variant="ghost"
      disabled={remove.isPending}
      onClick={() => {
        if (window.confirm("Delete this recording for good? Its comments go with it."))
          remove.mutate();
      }}
    >
      Delete
    </Button>
  );
}
