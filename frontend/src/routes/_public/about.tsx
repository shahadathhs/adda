import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Rocket, Target, Users } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
});

const VALUES = [
  {
    icon: Target,
    title: "Communities first",
    body: "We build for the people who gather around shared passions — not for engagement metrics.",
  },
  {
    icon: Heart,
    title: "Real-time by default",
    body: "Live video and live conversation belong together. Everything we make is instant.",
  },
  {
    icon: Rocket,
    title: "Built to last",
    body: "A dependable home you own and control, that grows with your audience over years.",
  },
];

const STATS = [
  { value: "2024", label: "Founded" },
  { value: "1", label: "Mission" },
  { value: "∞", label: "Communities possible" },
  { value: "0", label: "Ads, ever" },
];

function AboutPage() {
  return (
    <>
      <section className="border-b border-border py-16 text-center sm:py-20">
        <Container className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            About
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            We're building a better home for communities
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            adda exists to bring people together — around live moments, shared interests, and real
            conversation.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Our mission</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The internet has made it easy to broadcast, but hard to truly gather. We believe a
            community deserves more than a chat box under a video — it deserves a home. adda brings
            live streaming, realtime conversation, and shared content together in one place that
            belongs to you and your people.
          </p>
        </Container>
      </section>

      <section className="border-y border-border bg-muted/20 py-12">
        <Container className="grid grid-cols-2 gap-6 sm:grid-cols-4">
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

      <section className="py-20">
        <Container>
          <h2 className="text-center text-2xl font-bold sm:text-3xl">What we believe</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {VALUES.map((v) => (
              <Card key={v.title} className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <Card className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold sm:text-3xl">Join the journey</h2>
            <p className="max-w-xl text-muted-foreground">
              Build your community on adda and help shape what comes next.
            </p>
            <Link to="/register">
              <Button size="lg">
                Get started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </Container>
      </section>
    </>
  );
}
