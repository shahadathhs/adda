import { Reveal } from "@/components/reveal";
import { AboutCard } from "@/components/about/about-card";
import { PROJECT } from "@/lib/project";

const PARTS = [
  ["Streaming", "OBS publishes over RTMP; viewers watch over HLS in the browser."],
  ["Chat", "Realtime on every channel, with replies, reactions, polls and moderation."],
  ["Recordings", "Every broadcast is saved, with comments pinned to moments in it."],
  ["Yours", "One server, one install command, your data. No accounts on someone else's cloud."],
];

const STACK = ["FastAPI", "Next.js", "PostgreSQL", "Redis", "mediamtx", "Caddy"];

/** What adda is, who builds it, and where the source, the docs and the site live. */
export function AboutPage() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        About
      </p>
      <h1 className="mt-1.5 max-w-[720px] font-display text-[32px] font-bold leading-10 tracking-tight text-foreground sm:text-4xl sm:leading-[44px]">
        A live-streaming site you run yourself.
      </h1>
      <p className="mt-4 max-w-[640px] text-base leading-6 text-muted-foreground">
        adda (<span lang="bn">আড্ডা</span>) is Bengali for an informal, wide-ranging conversation
        among friends. It is a self-hosted platform for streaming and chatting in the browser: you
        install it on your own server, stream from OBS, and your community watches, talks and keeps
        every broadcast.
      </p>

      <Reveal>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTS.map(([title, body]) => (
            <li key={title} className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Who and where
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AboutCard
            title="The author"
            href={PROJECT.author.url}
            action={`@${PROJECT.author.handle} on GitHub`}
          >
            adda is designed, built and maintained by {PROJECT.author.handle}, as open-source
            software for people who would rather run their own stream than rent a platform.
          </AboutCard>
          <AboutCard title="Source code" href={PROJECT.repo} action="Open the repository">
            The whole platform is in one repository, under the MIT license: the API, the web app,
            the infrastructure and the docs. Issues and pull requests are welcome.
          </AboutCard>
          <AboutCard title="Website and docs" href={PROJECT.site} action="Visit the website">
            Install on a clean server, configure email, back up and restore, and upgrade: the guides
            cover running adda from the first command to the second year.
          </AboutCard>
        </div>
      </Reveal>

      <Reveal className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Built with
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {STACK.map((s) => (
            <li
              key={s}
              className="rounded-sm border border-border bg-card px-3 py-1.5 font-num text-[13px] text-muted-foreground"
            >
              {s}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
