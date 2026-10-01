import { useEffect, useRef, useState } from "react";

/**
 * Live preview player (HLS): native playback on WebKit, hls.js elsewhere.
 * Auto-reconnect watchdog keeps it glued to the live edge.
 */
export function LivePlayer({ hlsUrl, compact }: { hlsUrl: string; compact?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [status, setStatus] = useState<"connecting" | "playing" | "ended">("connecting");

  useEffect(() => {
    let cancelled = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const teardown = () => {
      if (watchdog) clearTimeout(watchdog);
      watchdog = null;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

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
          if (cancelled || !videoRef.current || !Hls.isSupported()) return;
          const hls = new Hls({ lowLatencyMode: true, liveDurationInfinity: true });
          hlsRef.current = hls;
          hls.loadSource(hlsUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => undefined));
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            else {
              hls.destroy();
              hlsRef.current = null;
            }
          });
        });
      }

      watchdog = setTimeout(() => {
        if (cancelled) return;
        if (videoRef.current && videoRef.current.currentTime === 0) {
          teardown();
          setup();
        }
      }, 3500);
    };

    setup();
    return () => {
      cancelled = true;
      teardown();
    };
  }, [hlsUrl]);

  return (
    <div className="relative overflow-hidden rounded-sm bg-black">
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        className={compact ? "aspect-video w-full max-w-md" : "aspect-video w-full"}
      />
      {status === "connecting" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-2xs text-white/80">Connecting to live stream…</p>
        </div>
      )}
    </div>
  );
}
