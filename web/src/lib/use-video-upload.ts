"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteVideo, startVideoUpload } from "@/lib/api";
import type { Video } from "@/lib/types";
import { sendVideoFile } from "@/lib/video-upload";
import { videoKeys } from "@/lib/use-videos";

const DEFAULT_CHUNK = 8 * 1024 * 1024;

export interface UploadMeta {
  title: string;
  description: string;
  visibility: Video["visibility"];
}

export type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; video: Video; sent: number; total: number }
  | { phase: "error"; video: Video | null; file: File; message: string };

/** One upload at a time for a channel: start, resume, cancel, with progress. */
export function useVideoUpload(communityId: string) {
  const qc = useQueryClient();
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const control = useRef<AbortController | null>(null);
  const refresh = useCallback(
    () => void qc.invalidateQueries({ queryKey: videoKeys.channel(communityId) }),
    [qc, communityId],
  );

  const run = useCallback(
    async (file: File, video: Video, chunkSize: number) => {
      const ctl = new AbortController();
      control.current = ctl;
      setState({ phase: "uploading", video, sent: video.received_bytes, total: file.size });
      try {
        await sendVideoFile({
          file,
          video,
          chunkSize,
          signal: ctl.signal,
          onProgress: (sent) => setState({ phase: "uploading", video, sent, total: file.size }),
        });
        setState({ phase: "idle" });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setState({
          phase: "error",
          video,
          file,
          message: e instanceof Error ? e.message : "The upload failed",
        });
      } finally {
        control.current = null;
        refresh();
      }
    },
    [refresh],
  );

  const start = useCallback(
    async (file: File, meta: UploadMeta) => {
      try {
        const started = await startVideoUpload(communityId, {
          title: meta.title.trim(),
          description: meta.description.trim() || null,
          visibility: meta.visibility,
          filename: file.name,
          size_bytes: file.size,
        });
        refresh();
        await run(file, started.video, started.chunk_size);
      } catch (e) {
        setState({
          phase: "error",
          video: null,
          file,
          message: e instanceof Error ? e.message : "Could not start the upload",
        });
      }
    },
    [communityId, refresh, run],
  );

  /** Continue an unfinished upload with the same file. */
  const resume = useCallback(
    async (video: Video, file: File) => {
      if (file.size !== video.size_bytes) {
        setState({
          phase: "error",
          video,
          file,
          message: "That is not the same file: its size differs from the one you started with.",
        });
        return;
      }
      await run(file, video, DEFAULT_CHUNK);
    },
    [run],
  );

  const cancel = useCallback(async () => {
    const video = state.phase === "idle" ? null : state.video;
    control.current?.abort();
    setState({ phase: "idle" });
    if (video) await deleteVideo(video.id).catch(() => undefined);
    refresh();
  }, [state, refresh]);

  const dismiss = useCallback(() => setState({ phase: "idle" }), []);

  // Leaving the page would stop the upload; ask first.
  const busy = state.phase === "uploading";
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  return { state, start, resume, cancel, dismiss };
}

export type VideoUpload = ReturnType<typeof useVideoUpload>;
