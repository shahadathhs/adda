"use client";

import { useEffect, useRef, useState } from "react";
import { LiveBadge } from "@/components/ui/primitives";
import { ViewerCount } from "@/components/viewer-count";

/**
 * HLS player with auto-reconnect watchdog: native HLS on Safari, hls.js
 * elsewhere. Re-runs setup if the stream never starts (live edge moving).
 */
export function LivePlayer({ hlsUrl, viewers }: { hlsUrl: string; viewers?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "ended">("connecting");

  useEffect(() => {
    let cancelled = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const setup = () => {
      const video = videoRef.current;
      if (!video || cancelled) return;
      setStatus("connecting");

      const onTime = () => {
        if (!cancelled && video.currentTime > 0) setStatus("playing");
      };
      video.addEventListener("timeupdate", onTime);

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        void video.play().catch(() => undefined);
      } else {
        import("hls.js").then(({ default: Hls }) => {
          if (cancelled || !videoRef.current) return;
          if (!Hls.isSupported()) return;
          const hls = new Hls({ lowLatencyMode: true, liveDurationInfinity: true });
          hlsRef.current = hls;
          hls.loadSource(hlsUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => undefined));
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
              hlsRef.current = null;
            }
          });
        });
      }

      // Watchdog: if we never start playing, tear down and retry.
      watchdog = setTimeout(() => {
        if (cancelled) return;
        if (videoRef.current && videoRef.current.currentTime === 0) {
          teardown();
          setup();
        }
      }, 3500);
    };

    const teardown = () => {
      if (watchdog) clearTimeout(watchdog);
      watchdog = null;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    setup();
    return () => {
      cancelled = true;
      teardown();
    };
  }, [hlsUrl]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-black">
      <div className="pointer-events-none absolute left-2 top-2 z-10">
        <LiveBadge />
      </div>
      {viewers !== undefined && (
        <div className="pointer-events-none absolute right-2 top-2 z-10">
          <ViewerCount viewers={viewers} />
        </div>
      )}
      <video ref={videoRef} controls autoPlay muted playsInline className="aspect-video w-full" />
      {status === "connecting" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-sm text-white/80">Connecting to live stream…</p>
        </div>
      )}
    </div>
  );
}
