import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  MessageCircle,
  PlayCircle,
  Radio,
  Shield,
  Sparkles,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { readUser } from "@/features/auth/hooks";

export const Route = createFileRoute("/_public/")({
  beforeLoad: ({ context }) => {
    // Authed users landing on "/" go straight to their feed.
    if (readUser(context.queryClient)) {
      throw redirect({ to: "/home" });
    }
  },
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Radio,
    title: "Go live in seconds",
    body: "Broadcast in HD with ultra-low latency. Viewers watch right in the browser — nothing to install.",
  },
  {
    icon: MessageCircle,
    title: "Realtime chat",
    body: "Live conversation with presence and replies, synced the instant a message is sent.",
  },
  {
    icon: Users,
    title: "True communities",
    body: "Members, roles, posts, and shared media — one home for everything your people do together.",
  },
  {
    icon: PlayCircle,
    title: "Recordings on demand",
    body: "Every stream is saved automatically, ready to replay the moment it ends.",
  },
  {
    icon: Bell,
    title: "Stay in the loop",
    body: "Notifications and presence keep members engaged long after the stream ends.",
  },
  {
    icon: Shield,
    title: "You're in control",
    body: "Roles, moderation, and privacy settings that put you in charge of your space.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your community",
    body: "Set up a home for your audience in under a minute. Pick a name, a handle, and you're in.",
  },
  {
    step: "02",
    title: "Go live or post",
    body: "Broadcast instantly or share updates, media, and files. Everything lives in one place.",
  },
  {
    step: "03",
    title: "Grow together",
    body: "Chat in realtime, build an audience, and keep members coming back with recordings and posts.",
  },
];

const STATS = [
  { value: "HD", label: "Live streaming" },
  { value: "<3s", label: "Glass-to-glass latency" },
  { value: "∞", label: "Members per community" },
  { value: "24/7", label: "Always available" },
];

function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.18),transparent)]"
        />
        <Container className="relative pb-20 pt-20 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Live streaming, built in
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Communities that happen to{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                stream
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Bring your audience together with live video, realtime chat, and shared content — all
              in one home that's actually yours.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore features
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required.</p>
          </div>

          {/* Product preview */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_220px] sm:p-6">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/20">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Video className="h-8 w-8 text-foreground/70" />
                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {["Avery", "Jordan", "Sam", "Priya"].map((n, i) => (
                    <div
                      key={n}
                      className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/30 text-[10px] font-semibold text-primary">
                        {n[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {["Nice stream!", "🔥🔥🔥", "Hello!", "Greetings"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/20">
        <Container className="grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-3xl font-extrabold text-transparent">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </Container>
      </section>

      {/* Features */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your community needs
            </h2>
            <p className="mt-3 text-muted-foreground">
              One platform for going live, talking in realtime, and sharing what matters.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Steps */}
      <section className="border-t border-border bg-muted/20 py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Live in three steps</h2>
            <p className="mt-3 text-muted-foreground">From zero to broadcasting in minutes.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="relative">
                <div className="mb-4 text-4xl font-extrabold text-primary/30">{s.step}</div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Highlight band */}
      <section className="py-20">
        <Container>
          <Card className="overflow-hidden">
            <div className="grid items-center gap-8 p-8 sm:p-12 md:grid-cols-2">
              <div>
                <Zap className="mb-4 h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">Built for the moment</h2>
                <p className="mt-3 text-muted-foreground">
                  Low-latency streaming means your chat reacts in real time. No more "am I lagging?"
                  — just you and your audience, in sync.
                </p>
                <Link to="/login" className="mt-6 inline-block">
                  <Button>
                    Start your community <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Radio, label: "Live video" },
                  { icon: MessageCircle, label: "Realtime chat" },
                  { icon: Users, label: "Members & roles" },
                  { icon: PlayCircle, label: "Instant replays" },
                ].map((x) => (
                  <div
                    key={x.label}
                    className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6 text-center"
                  >
                    <x.icon className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">{x.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="pb-24 pt-4">
        <Container>
          <div className="rounded-2xl bg-gradient-to-r from-primary to-purple-500 px-6 py-16 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to go live?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Create your community today and bring your people together.
            </p>
            <Link to="/login" className="mt-8 inline-block">
              <Button size="lg" variant="secondary">
                Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
