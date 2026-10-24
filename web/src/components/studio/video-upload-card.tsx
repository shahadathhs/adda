"use client";

import { useRef, useState } from "react";
import { FileVideo, Upload } from "lucide-react";
import type { Video } from "@/lib/types";
import type { VideoUpload } from "@/lib/use-video-upload";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { VisibilitySelect } from "@/components/studio/visibility-select";

const MAX = 4 * 1024 ** 3;
const ACCEPT = ".mp4,.m4v,.mov,.webm,video/mp4,video/quicktime,video/webm";

const titleFrom = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();

/** Choose a video, name it, and send it; shows progress, and what to do when it stops. */
export function VideoUploadCard({ upload }: { upload: VideoUpload }) {
  const { state } = upload;
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Video["visibility"]>("public");
  const [problem, setProblem] = useState<string | null>(null);

  const choose = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX) return setProblem("A video can be at most 4 GB.");
    if (!/\.(mp4|m4v|mov|webm)$/i.test(f.name))
      return setProblem("Choose an MP4, MOV or WebM file.");
    setProblem(null);
    setFile(f);
    setTitle((t) => t || titleFrom(f.name));
  };

  if (state.phase === "uploading") {
    const pct = state.total ? Math.min(100, (state.sent / state.total) * 100) : 0;
    return (
      <section className="rounded-md border border-border bg-card p-5" aria-live="polite">
        <h2 className="font-display text-base font-semibold text-foreground">Uploading</h2>
        <p className="mt-1 truncate text-[13px] text-muted-foreground">{state.video.title}</p>
        <div
          role="progressbar"
          aria-label="Upload progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          className="mt-4 h-2 overflow-hidden rounded-xs bg-secondary"
        >
          <div
            className="h-full origin-left bg-primary transition-transform duration-120"
            style={{ transform: `scaleX(${pct / 100})` }}
          />
        </div>
        <p className="mt-2 flex justify-between font-num text-xs text-muted-foreground">
          <span>
            {formatBytes(state.sent)} of {formatBytes(state.total)}
          </span>
          <span>{Math.round(pct)}%</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground/80">
          Keep this page open. If the connection drops, the upload retries by itself.
        </p>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => void upload.cancel()}>
            Cancel upload
          </Button>
        </div>
      </section>
    );
  }

  if (state.phase === "error") {
    return (
      <section role="alert" className="rounded-md border border-destructive/60 bg-card p-5">
        <h2 className="font-display text-base font-semibold text-destructive">Upload stopped</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{state.message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => void upload.cancel()}>
            Discard
          </Button>
          {state.video && (
            <Button variant="primary" onClick={() => void upload.resume(state.video!, state.file)}>
              Try again
            </Button>
          )}
          {!state.video && (
            <Button variant="outline" onClick={upload.dismiss}>
              Back
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <form
      className="space-y-4 rounded-md border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return;
        void upload.start(file, { title, description, visibility });
        setFile(null);
        setTitle("");
        setDescription("");
      }}
    >
      <h2 className="font-display text-base font-semibold text-foreground">Upload a video</h2>

      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Choose a video file"
        onChange={(e) => {
          choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          choose(e.dataTransfer.files[0]);
        }}
        className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-8 text-center outline-none transition-colors duration-120 hover:border-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {file ? (
          <FileVideo className="h-6 w-6 text-primary" aria-hidden="true" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        )}
        <span className="text-sm text-foreground">
          {file ? file.name : "Choose a video or drop it here"}
        </span>
        <span className="text-xs text-muted-foreground">
          {file
            ? formatBytes(file.size)
            : "MP4, MOV or WebM, up to 4 GB. H.264 or VP9 plays everywhere."}
        </span>
      </button>
      {problem && (
        <p role="alert" className="text-xs text-destructive">
          {problem}
        </p>
      )}

      {file && (
        <>
          <Field label="Title" htmlFor="video-title">
            <Input
              id="video-title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="video-description">
            <textarea
              id="video-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-sm border border-input bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
          </Field>
          <Field label="Who can watch" htmlFor="video-visibility">
            <VisibilitySelect id="video-visibility" value={visibility} onChange={setVisibility} />
          </Field>
          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={!title.trim()}>
              Upload
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
