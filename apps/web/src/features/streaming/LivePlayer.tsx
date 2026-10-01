import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Status = "connecting" | "playing" | "ended";

/**
 * HLS live player. HLS is the right transport for an arbitrary OBS RTMP
 * stream — it handles B-frames and AAC audio with no streamer-side config.
 *
 * Auto-load: if the video hasn't started playing a few seconds after mount
 * (stream just went live, manifest not quite ready, autoplay edge cases…),
 * we tear down hls.js and recreate it — exactly like a manual reload, but
 * automatic and behind the loading overlay. The watchdog stops the moment
 * playback starts, so it can't cause flicker mid-stream.
 */
export default function LivePlayer({ hlsUrl }: { hlsUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setStatus("connecting");

    let everPlayed = false;
    let cancelled = false;
    let hls: Hls | null = null;
    let watchdog: number | undefined;

    // Only trust that playback is *really* happening once the playhead is
    // advancing. The `playing` event can fire before any frame is actually
    // shown — trusting it hides the overlay and stops the retry too early,
    // leaving a gray, paused video. `timeupdate` only fires during real
    // playback, so it's a reliable "frames are rendering" signal.
    const markPlaying = () => {
      if (!everPlayed && !video.paused) {
        everPlayed = true;
        setStatus("playing");
      }
    };
    const onEnded = () => setStatus("ended");
    video.addEventListener("timeupdate", markPlaying);
    video.addEventListener("ended", onEnded);

    const setup = () => {
      if (cancelled) return;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.play().catch(() => {});
      } else if (Hls.isSupported()) {
        hls = new Hls({ lowLatencyMode: true, liveDurationInfinity: true });
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || !hls) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        });
      }

      // Watchdog: if nothing is playing in 3.5s, start fresh (auto-reload).
      watchdog = window.setTimeout(() => {
        if (cancelled || everPlayed) return;
        hls?.destroy();
        hls = null;
        setup();
      }, 3500);
    };

    setup();

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
      video.removeEventListener("timeupdate", markPlaying);
      video.removeEventListener("ended", onEnded);
      hls?.destroy();
    };
  }, [hlsUrl]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} controls autoPlay muted playsInline className="h-full w-full" />
      {status !== "playing" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-sm text-white">
          {status === "connecting" ? (
            <>
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Connecting to live stream…
            </>
          ) : (
            <span>Stream ended</span>
          )}
        </div>
      )}
    </div>
  );
}
