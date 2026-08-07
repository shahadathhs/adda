import { Link } from "@tanstack/react-router";
import { FiArrowRight, FiMessageCircle, FiRadio, FiServer, FiUsers } from "react-icons/fi";
import { UserAvatar } from "@/shared/ui/user-avatar";
import { Button } from "@/shared/ui/button";
import { useCommunities } from "@/features/communities/hooks";

const FEATURES = [
  {
    icon: FiUsers,
    title: "Communities",
    body: "Posts, chat, files, members, and live — one hub per community.",
  },
  {
    icon: FiRadio,
    title: "Live streaming",
    body: "Go live from OBS; viewers watch right in the browser.",
  },
  {
    icon: FiMessageCircle,
    title: "Realtime chat",
    body: "Telegram-style chat with presence, reactions, and replies.",
  },
  {
    icon: FiServer,
    title: "Self-hosted",
    body: "Your data, your box. One `docker compose up` and you're live.",
  },
];

export default function LandingPage() {
  const { data: communities = [] } = useCommunities();
  const live = communities.filter((c) => c.is_live);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-xl font-bold text-transparent">
          adda
        </span>
        <div className="flex gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-12 pt-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          open · self-hosted · streaming-first
        </div>
        <h1 className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Communities that happen to stream.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Self-hosted hubs for posts, chat, files, and live — Telegram Channels meets Discord meets
          Twitch, deployable in one command.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register">
            <Button size="lg">
              Create your account <FiArrowRight className="ml-1 inline" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      {/* Live now */}
      {live.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Live now
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((c) => (
              <Link
                key={c.id}
                to="/register"
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={c.name} src={c.avatar_url} className="h-10 w-10" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{c.name}</span>
                      <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                        <span className="h-1 w-1 rounded-full bg-red-500" /> LIVE
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.member_count} members
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold">Run your own community.</h2>
        <p className="mt-2 text-muted-foreground">
          No platform lock-in. No ads. Just you and your people.
        </p>
        <Link to="/register" className="mt-6 inline-block">
          <Button size="lg">Get started</Button>
        </Link>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        adda · self-hosted community platform
      </footer>
    </div>
  );
}
