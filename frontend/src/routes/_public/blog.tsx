import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/features/site/components/page-header";

export const Route = createFileRoute("/_public/blog")({
  head: () => ({
    title: "Blog — adda",
    meta: [
      {
        name: "description",
        content: "Updates, tutorials, and stories from the adda community platform.",
      },
      { property: "og:title", content: "Blog — adda" },
      {
        property: "og:description",
        content: "Updates, tutorials, and stories from the adda community platform.",
      },
    ],
  }),
  component: BlogPage,
});

const POSTS = [
  {
    title: "Welcome to adda",
    date: "Aug 7, 2026",
    author: "The adda team",
    excerpt:
      "Why we're building a home for communities that happen to stream — and what's coming next as we bring live video and realtime conversation together.",
    body: "Communities deserve more than a chat box under a video. adda brings live streaming, realtime chat, and shared content into one place that belongs to you. Today we're opening the doors and we can't wait to see what you build.",
  },
  {
    title: "Designing for low-latency live",
    date: "Jul 22, 2026",
    author: "The adda team",
    excerpt:
      "A peek under the hood at how we keep stream latency low so chat and video stay perfectly in sync.",
    body: "Latency is the difference between a conversation and a broadcast. We tuned our pipeline for sub-3-second glass-to-glass latency so your audience reacts in real time — no awkward delays.",
  },
  {
    title: "Building communities, not channels",
    date: "Jun 30, 2026",
    author: "The adda team",
    excerpt:
      "Our philosophy on what makes a community thrive, and the product decisions that follow from it.",
    body: "A channel is a feed. A community is a home. Every feature in adda — roles, posts, recordings, presence — is designed to help people gather, return, and belong.",
  },
];

function Meta({ date, author }: { date: string; author: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{date}</span>
      <span>·</span>
      <span>{author}</span>
    </div>
  );
}

function BlogPage() {
  const [featured, ...rest] = POSTS;
  return (
    <>
      <PageHeader
        badge="Company"
        title="Blog"
        subtitle="Updates, ideas, and stories from the team."
      />
      <section className="py-16">
        <Container className="space-y-10">
          {/* Featured */}
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="min-h-[220px] bg-gradient-to-br from-primary/30 to-purple-500/20" />
              <div className="p-8">
                <Badge className="mb-3">Latest</Badge>
                <h2 className="text-2xl font-bold">{featured.title}</h2>
                <div className="mt-2">
                  <Meta date={featured.date} author={featured.author} />
                </div>
                <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {featured.body}
                </p>
              </div>
            </div>
          </Card>

          {/* Rest */}
          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((p) => (
              <Card key={p.title} className="p-7 transition-colors hover:border-primary/50">
                <Meta date={p.date} author={p.author} />
                <h3 className="mt-2 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
