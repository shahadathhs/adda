import { execFileSync, spawn, type ChildProcess } from "node:child_process";

/** A test-pattern RTMP publisher: a local ffmpeg if there is one, otherwise an ffmpeg container. */
export function startPublisher(rtmpUrl: string): { stop: () => void } {
  const args = (host: string) => [
    "-re",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=1280x720:rate=30",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-tune",
    "zerolatency",
    "-g",
    "60",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "96k",
    "-f",
    "flv",
    rtmpUrl.replace("//localhost", `//${host}`),
  ];

  let hasFfmpeg = true;
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  } catch {
    hasFfmpeg = false;
  }

  let child: ChildProcess;
  if (hasFfmpeg) {
    child = spawn("ffmpeg", ["-loglevel", "error", ...args("localhost")], { stdio: "ignore" });
    return { stop: () => child.kill("SIGTERM") };
  }
  const name = `adda-e2e-${process.pid}`;
  child = spawn(
    "docker",
    ["run", "--rm", "--name", name, "jrottenberg/ffmpeg:6-alpine", ...args("host.docker.internal")],
    { stdio: "ignore" },
  );
  return {
    stop: () => {
      try {
        execFileSync("docker", ["rm", "-f", name], { stdio: "ignore" });
      } catch {
        /* already gone */
      }
      child.kill("SIGTERM");
    },
  };
}
