import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  KeyRound,
  MessageCircle,
  MonitorPlay,
  Radio,
  Shield,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";

export const Route = createFileRoute("/_public/features")({
  component: FeaturesPage,
});

const BLOCKS = [
  {
    icon: Radio,
    eyebrow: "Live streaming",
    title: "Broadcast in stunning HD",
    body: "Go live from your favorite tools and reach your audience with sub-3-second latency. Adaptive streaming means a smooth experience on any device and any connection.",
    points: ["Ultra-low-latency HLS", "Automatic recordings", "Browser playback, no plugins"],
  },
  {
    icon: MessageCircle,
    eyebrow: "Realtime",
    title: "Conversation that keeps up",
    body: "Chat syncs the instant a message is sent, with live presence so you always know who's around. Reply, react, and keep the energy going during and after the stream.",
    points: ["Instant message delivery", "Online presence", "Threaded replies"],
  },
  {
    icon: Users,
    eyebrow: "Community",
    title: "A real home, not just a channel",
    body: "Bring members together with roles, posts, and shared media. adda is built around communities first — everything lives in one place your people keep coming back to.",
    points: ["Roles & permissions", "Posts & announcements", "Member directory"],
  },
];

const MORE = [
  {
    icon: MonitorPlay,
    title: "Adaptive playback",
    body: "Smooth video on slow and fast connections alike.",
  },
  { icon: Bell, title: "Notifications", body: "Let members know the moment you go live or post." },
  { icon: Shield, title: "Moderation", body: "Suspend, manage, and keep your space healthy." },
  {
    icon: KeyRound,
    title: "Secure stream keys",
    body: "Only you can broadcast to your community.",
  },
  {
    icon: Video,
    title: "Recordings archive",
    body: "Every stream saved, ready to replay instantly.",
  },
  { icon: Sparkles, title: "Built to grow", body: "A platform that scales with your audience." },
];

function FeaturesPage() {
  return (
    <>
      <section className="border-b border-border py-16 sm:py-20">
        <Container className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            One platform. Everything connected.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Live video, realtime chat, and a real community home — designed to work together from
            the ground up.
          </p>
        </Container>
      </section>

      <section className="space-y-20 py-20">
        <Container className="space-y-20">
          {BLOCKS.map((b, i) => (
            <div
              key={b.title}
              className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  <b.icon className="h-4 w-4" /> {b.eyebrow}
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">{b.title}</h2>
                <p className="mt-3 text-muted-foreground">{b.body}</p>
                <ul className="mt-5 space-y-2">
                  {b.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="aspect-[4/3] bg-gradient-to-br from-primary/15 to-purple-500/10" />
            </div>
          ))}
        </Container>
      </section>

      <section className="border-t border-border bg-muted/20 py-20">
        <Container>
          <h2 className="text-center text-2xl font-bold sm:text-3xl">And a whole lot more</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MORE.map((m) => (
              <Card key={m.title} className="p-6">
                <m.icon className="mb-3 h-6 w-6 text-primary" />
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <Card className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
            <h2 className="text-2xl font-bold sm:text-3xl">See it in action</h2>
            <p className="max-w-xl text-muted-foreground">
              Create your community and go live in minutes — no setup headaches.
            </p>
            <Link to="/login">
              <Button size="lg">
                Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </Container>
      </section>
    </>
  );
}
