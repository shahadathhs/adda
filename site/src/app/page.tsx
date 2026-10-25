import Link from "next/link";
import { Check } from "lucide-react";
import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { ExternalLink } from "@/components/external-link";
import { InstallCommand } from "@/components/install-command";
import { Screen } from "@/components/screen";
import { SITE } from "@/lib/site";

const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

const FEATURES = [
  {
    eyebrow: "Watch and chat",
    title: "A channel page that is the stream and the room.",
    body: "Viewers open a link and watch, with a viewer count and an automatic reconnect. Chat sits beside the video with replies, @mentions, reactions, your own emotes, a pinned message and live polls.",
    points: [
      "Guests can watch and read. Everything interactive needs an account.",
      "Reconnects catch up on missed messages without a reload.",
      "When the broadcast ends, chat stays open and the recording is saved.",
    ],
    src: "/screens/channel-live.png",
    alt: "A live channel page: the stream on the left, chat with a pinned message and a poll on the right.",
  },
  {
    eyebrow: "Studio",
    title: "Everything the streamer needs while live, on one screen.",
    body: "The studio shows the stream as viewers see it, its health, and the chat. Start a poll, switch on slow mode or followers-only, and act on a message without leaving the page.",
    points: [
      "Copy the server and stream key for OBS in one click.",
      "Rotating the key disconnects the old encoder at once.",
      "Moderators delete, time out and ban; every action is logged.",
    ],
    src: "/screens/studio-live.png",
    alt: "The studio's Live tab: preview player, stream health tiles, poll controls and chat moderation.",
  },
  {
    eyebrow: "Channel page",
    title: "About, links, announcements and followers.",
    body: "Each channel has a banner, an about text, up to five links and announcements with a pin. Followers get a bell when you go live, and an email only if they ask for one.",
    points: [
      "Emails are opt-in, per channel, at most one an hour.",
      "No email server? The email controls simply do not appear.",
      "Recordings play in the browser, with timestamped comments.",
    ],
    src: "/screens/channel-profile.png",
    alt: "A channel profile with an about text, a link, an announcement and a list of followers.",
  },
  {
    eyebrow: "Videos",
    title: "Upload a video. It plays as you made it.",
    body: "Channel owners upload MP4, MOV or WebM files up to 4 GB from the studio. The file goes up in parts and resumes after a dropped connection, then the server checks it, moves the index to the front so playback starts at once, and takes a poster frame.",
    points: [
      "Public, unlisted or private, and editable at any time.",
      "No transcoding: H.264, VP8, VP9 or AV1 plays directly, and anything else fails with a clear message.",
      "Videos appear on the channel page, in a directory and in search.",
    ],
    src: "/screens/studio-videos.png",
    alt: "The studio's Videos tab: a list of uploaded videos with their status and the upload card.",
  },
  {
    eyebrow: "Find things",
    title: "One search box, and a directory for everything.",
    body: "Search suggests channels, videos and recordings as you type, live ones first. Live, Channels, Videos and Recordings each have their own page with filters, sorting and numbered pages that you can bookmark.",
    points: [
      "Arrow keys, Enter and Escape work in the search box.",
      "Filters and the page number live in the address, so any view can be shared.",
      "Private channels never appear anywhere.",
    ],
    src: "/screens/videos.png",
    alt: "The video directory: a filter bar, a grid of video cards with durations, and page numbers.",
  },
  {
    eyebrow: "Your account",
    title: "A picture, a status, and chat on your terms.",
    body: "Upload a profile picture, set a short status with an optional end time, and choose whether you chat under your name or as Anonymous. Notifications are per channel, and email is opt-in.",
    points: [
      "Anonymous hides your name from viewers, not from the moderators.",
      "Change your password in the same place.",
      "Signing out takes you back to the home page.",
    ],
    src: "/screens/settings.png",
    alt: "The settings page: profile with a picture, a status card, chat identity and password.",
  },
];

const STATUS: [string, string][] = [
  ["Live streaming (OBS in, browser out)", "Built, with automatic recordings"],
  ["Realtime chat: replies, mentions, reactions, emotes, pins, polls", "Built"],
  ["Moderation: delete, time out, ban, slow mode, followers-only, audit log", "Built"],
  ["Anonymous chat that stays recorded against the account", "Built"],
  ["Follows, bell notifications, optional live emails", "Built"],
  ["Channel pages, announcements, recording comments", "Built"],
  [
    "Search, directories with filters and pages, video uploads (resumable, no transcoding)",
    "Built",
  ],
  ["Profile pictures and statuses", "Built"],
  [
    "One-command install with automatic HTTPS",
    "Built; timed install on a clean server still to measure",
  ],
  ["Prometheus metrics, JSON logs, backup and restore", "Built and tested"],
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="rise max-w-3xl">
          <p className={eyebrow}>Self-hosted live streaming</p>
          <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.05] tracking-tight sm:text-6xl">
            {SITE.tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            adda is a live-streaming site you install on your own server. Stream from OBS, and
            people watch and chat in the browser while every broadcast is{" "}
            <span className="text-live">recorded</span>. No accounts on someone else&apos;s servers,
            no per-minute fees.
          </p>
        </div>
        <div className="rise mt-8 w-fit max-w-full" style={{ animationDelay: "80ms" }}>
          <InstallCommand command={SITE.install} />
          <p className="mt-3 text-sm text-muted-foreground">
            On a Linux server with a domain pointing at it.{" "}
            <Link href="/docs/quickstart" className="text-primary underline underline-offset-4">
              Read the quickstart
            </Link>
            .
          </p>
        </div>
        <div className="rise mt-12" style={{ animationDelay: "160ms" }}>
          <Screen
            src="/screens/channel-live.png"
            alt="A live adda channel: video, chat, a pinned message and a poll."
            priority
          />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-24 px-4 py-20 sm:px-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <p className={eyebrow}>{f.eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
                  {f.title}
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">{f.body}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <Screen src={f.src} alt={f.alt} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <p className={eyebrow}>Who can do what</p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
              Guests watch. Accounts act. Anonymous is still recorded.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Every chat message, reaction and vote belongs to an account in the database, and the
              server refuses writes from guests, not just the page. Accounts can choose to appear as
              &ldquo;Anonymous&rdquo;: viewers never receive their name or id, but the channel
              owner, its moderators and the server admin can see who is behind a message, and each
              lookup is logged.
            </p>
          </div>
          <dl className="divide-y divide-border rounded-lg border border-border bg-card">
            {[
              ["Guest", "Watch, read chat, read polls, play recordings"],
              ["Account", "Chat, reply, react, vote, follow, comment on recordings"],
              ["Moderator", "Delete, pin, time out, ban, slow mode, reveal an anonymous author"],
              ["Owner", "Everything above, plus stream key, emotes, channel page, moderators"],
              ["Admin", "Users, streams and recordings across the server, through an API"],
            ].map(([who, what]) => (
              <div key={who} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <dt className="font-semibold">{who}</dt>
                <dd className="text-sm text-muted-foreground">{what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className={eyebrow}>How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
            One small stack, nothing hidden.
          </h2>
          <ArchitectureDiagram />
          <div className="mt-8 grid gap-6 text-sm leading-6 text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Publish",
                "The encoder pushes RTMP with your key. mediamtx asks the backend if the key is right.",
              ],
              [
                "Watch",
                "Viewers get HLS in the browser, a few seconds behind. Recordings are written as you go.",
              ],
              [
                "Chat",
                "One WebSocket. Messages are saved first, then fanned out through Redis to every server.",
              ],
              [
                "Run",
                "Docker Compose, Postgres, Redis. Metrics, JSON logs, and a backup script are included.",
              ],
            ].map(([t, b]) => (
              <div key={t}>
                <h3 className="font-display text-base font-semibold text-foreground">{t}</h3>
                <p className="mt-1.5">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className={eyebrow}>Honest status</p>
          <h2 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight">
            What is built, and what is not.
          </h2>
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <tbody>
                {STATUS.map(([what, state]) => (
                  <tr key={what} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3 text-foreground">{what}</td>
                    <td className="px-5 py-3 text-muted-foreground">{state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
            Not in version 1: desktop or mobile apps, direct messages, several rooms per channel, a
            light theme, an admin web interface, transcoding or clips, and WebRTC playback. Playback
            is HLS, and recordings and uploaded videos are not transcoded, so quality is what the
            encoder or the uploader sends. The full scope, with the reasoning, is in the{" "}
            <ExternalLink
              href={`${SITE.repo}/blob/dev/docs/SCOPE.md`}
              className="text-primary underline underline-offset-4"
            >
              repository
            </ExternalLink>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight">
            Your server. Your streams. Your chat.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A 2 GB server, a domain and ports 80, 443 and 1935 is all it needs.
          </p>
          <div className="mt-7 flex justify-center text-left">
            <InstallCommand command={SITE.install} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/docs/quickstart"
              className="inline-flex h-10 items-center rounded-sm bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-[120ms] hover:bg-primary-hover"
            >
              Quickstart
            </Link>
            <ExternalLink
              href={SITE.repo}
              className="inline-flex h-10 items-center rounded-sm border border-input px-5 text-sm font-medium transition-colors duration-[120ms] hover:bg-secondary"
            >
              View the source
            </ExternalLink>
          </div>
        </div>
      </section>
    </main>
  );
}
