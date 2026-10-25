import { Download } from "lucide-react";
import { recordingFileUrl } from "@/lib/recordings";

/** Download link for a recording. */
export function DownloadRecording({ path, name }: { path: string; name: string }) {
  return (
    <a
      href={recordingFileUrl(path)}
      download={name}
      className="inline-flex h-8 items-center gap-2 rounded-sm border border-input px-3.5 text-sm font-medium text-foreground transition-colors duration-120 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
    </a>
  );
}
