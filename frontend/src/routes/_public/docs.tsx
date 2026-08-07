import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, Radio, Users, Video } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/features/site/components/page-header";

export const Route = createFileRoute("/_public/docs")({
  component: DocsPage,
});

const GUIDES = [
  {
    icon: Users,
    title: "Create your community",
    body: "Set up a home for your audience — name, handle, and you're in.",
  },
  {
    icon: Radio,
    title: "Go live",
    body: "Broadcast from your favorite tool and reach viewers in seconds.",
  },
  {
    icon: Video,
    title: "Recordings",
    body: "Every stream is saved automatically and ready to replay.",
  },
  {
    icon: MessageCircle,
    title: "Realtime chat",
    body: "Talk with your audience live, with presence and replies.",
  },
];

const FAQ = [
  {
    q: "How do I create a community?",
    a: "Sign up, then create a community from your home screen. Pick a name and a handle — that's it.",
  },
  {
    q: "What do I need to stream?",
    a: "Any tool that outputs a standard stream. Viewers never need to install anything; they watch right in the browser.",
  },
  {
    q: "Are my streams recorded?",
    a: "Yes. Recordings are saved automatically and appear under your community's Recordings tab once the stream ends.",
  },
  {
    q: "Can I moderate my community?",
    a: "Absolutely. Roles, suspensions, and member management give you full control over your space.",
  },
];

function DocsPage() {
  return (
    <>
      <PageHeader
        badge="Resources"
        title="Documentation"
        subtitle="Everything you need to get started and grow."
      />

      <section className="py-16">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Guides</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <Card key={g.title} className="p-6 transition-colors hover:border-primary/50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <g.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{g.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{g.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-muted/20 py-16">
        <Container>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">FAQ</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <Card className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to dive in?</h2>
            <p className="max-w-md text-muted-foreground">
              Create your account and start building your community today.
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
