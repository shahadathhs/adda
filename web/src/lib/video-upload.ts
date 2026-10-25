import { ApiError, completeVideoUpload, getVideo, putVideoChunk } from "@/lib/api";
import type { Video } from "@/lib/types";

const RETRIES = 4;
const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Upload cancelled", "AbortError"));
      },
      { once: true },
    );
  });

/**
 * Send `file` in parts from where the server already has it (a fresh upload starts at 0, a resumed
 * one wherever it stopped), then finish it. A dropped connection or a wrong offset is retried
 * from the server's own count; a cancel throws an AbortError.
 */
export async function sendVideoFile({
  file,
  video,
  chunkSize,
  onProgress,
  signal,
}: {
  file: File;
  video: Video;
  chunkSize: number;
  onProgress: (sentBytes: number) => void;
  signal?: AbortSignal;
}): Promise<Video> {
  let offset = video.received_bytes;
  onProgress(offset);
  let failures = 0;

  while (offset < file.size) {
    const part = file.slice(offset, Math.min(offset + chunkSize, file.size));
    try {
      offset = await putVideoChunk(video.id, offset, part, (n) => onProgress(offset + n), signal);
      onProgress(offset);
      failures = 0;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      // Authorisation and validation problems will not fix themselves; anything else may.
      const hard = e instanceof ApiError && [400, 401, 403, 404].includes(e.status);
      if (hard || ++failures > RETRIES) throw e;
      await wait(1000 * 2 ** (failures - 1), signal);
      offset = (await getVideo(video.id)).received_bytes; // where the server really is
      onProgress(offset);
    }
  }
  return completeVideoUpload(video.id);
}
