import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";

export const Route = createFileRoute("/_public/pricing")({
  component: PricingPage,
});

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    cadence: "forever",
    description: "Everything you need to go live and build your first community.",
    cta: "Get started",
    to: "/register" as const,
    featured: false,
    features: [
      "1 community",
      "HD live streaming",
      "Realtime chat",
      "Recordings (7 days)",
      "Up to 100 members",
    ],
  },
  {
    name: "Creator",
    price: "$12",
    cadence: "per month",
    description: "For creators growing an audience around their live content.",
    cta: "Start Creator",
    to: "/register" as const,
    featured: true,
    features: [
      "Up to 5 communities",
      "Unlimited recordings",
      "Priority streaming",
      "Custom branding",
      "Up to 2,000 members",
      "Member roles",
    ],
  },
  {
    name: "Community",
    price: "$49",
    cadence: "per month",
    description: "For large communities and organizations that need scale and control.",
    cta: "Contact sales",
    to: "/register" as const,
    featured: false,
    features: [
      "Unlimited communities",
      "Advanced moderation",
      "Analytics & insights",
      "Priority support",
      "Unlimited members",
      "SSO & permissions",
    ],
  },
];

const FAQ = [
  {
    q: "Can I start for free?",
    a: "Yes. The Starter plan is free forever and includes everything you need to go live and grow a community.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. Upgrade or downgrade at any time — changes take effect immediately.",
  },
  {
    q: "Do I need any software to stream?",
    a: "You can broadcast from any tool that supports standard streaming output. Viewers never need to install anything.",
  },
  {
    q: "Is there a trial for paid plans?",
    a: "Paid plans are risk-free with a full refund within the first 14 days, no questions asked.",
  },
];

function PricingPage() {
  return (
    <>
      <section className="border-b border-border py-16 text-center sm:py-20">
        <Container className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Simple pricing that scales with you
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when your community grows.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <Card
                key={p.name}
                className={`relative flex flex-col p-7 ${p.featured ? "border-primary shadow-lg ring-1 ring-primary" : ""}`}
              >
                {p.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/ {p.cadence}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={p.to} className="mt-7">
                  <Button className="w-full" variant={p.featured ? "default" : "outline"}>
                    {p.cta}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            All plans include HD streaming, realtime chat, and recordings. Prices in USD.
          </p>
        </Container>
      </section>

      <section className="border-t border-border bg-muted/20 py-20">
        <Container className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-10 space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-primary to-purple-500 px-6 py-12 text-center text-primary-foreground">
            <h2 className="text-2xl font-bold sm:text-3xl">Start free today</h2>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Get started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
