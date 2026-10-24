import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A 3-second H.264/AAC MP4 test video, from a local ffmpeg or an ffmpeg container. It is written
 * the plain way (index at the end), which the server must fix for streaming.
 */
export function makeTestVideo(): string {
  const dir = mkdtempSync(join(tmpdir(), "adda-e2e-"));
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=640x360:rate=25:duration=3",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=3",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
  ];
  try {
    execFileSync("ffmpeg", ["-loglevel", "error", ...args, join(dir, "clip.mp4")], {
      stdio: "ignore",
    });
  } catch {
    execFileSync(
      "docker",
      [
        "run",
        "--rm",
        "-v",
        `${dir}:/out`,
        "jrottenberg/ffmpeg:6-alpine",
        "-loglevel",
        "error",
        ...args,
        "/out/clip.mp4",
      ],
      { stdio: "ignore" },
    );
  }
  return join(dir, "clip.mp4");
}
