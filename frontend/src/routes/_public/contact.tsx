import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { PageHeader } from "@/features/site/components/page-header";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    title: "Contact — adda",
    meta: [
      { name: "description", content: "Get in touch with the adda team." },
      { property: "og:title", content: "Contact — adda" },
      { property: "og:description", content: "Get in touch with the adda team." },
    ],
  }),
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: Mail,
    title: "Email",
    body: (
      <a href="mailto:hello@adda.example" className="hover:underline">
        hello@adda.example
      </a>
    ),
  },
  {
    icon: MessageCircle,
    title: "Community",
    body: "Join the conversation and get help from the team and other creators.",
  },
  {
    icon: Clock,
    title: "Response time",
    body: "We typically reply within one business day, Monday to Friday.",
  },
];

function ContactPage() {
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    // No backend yet — acknowledge and reset. Wire to an endpoint when ready.
    setTimeout(() => {
      setBusy(false);
      toast.success("Thanks! Your message has been sent.");
      (e.target as HTMLFormElement).reset();
    }, 500);
  };

  return (
    <>
      <PageHeader badge="Company" title="Get in touch" subtitle="We'd love to hear from you." />
      <section className="py-16">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              {CHANNELS.map((c) => (
                <Card key={c.title} className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{c.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{c.body}</p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 sm:p-8">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help?"
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send message"}
                </Button>
              </form>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
