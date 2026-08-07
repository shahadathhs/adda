import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/features/site/components/page-header";

export const Route = createFileRoute("/_public/roadmap")({
  component: RoadmapPage,
});

type Status = "In progress" | "Planned" | "Considering";

const COLUMNS: { title: string; status: Status; dot: string; items: string[] }[] = [
  {
    title: "In progress",
    status: "In progress",
    dot: "bg-emerald-500",
    items: ["Chat persistence and message history", "Direct messages", "Image and video uploads"],
  },
  {
    title: "Planned",
    status: "Planned",
    dot: "bg-primary",
    items: [
      "Posts and announcements",
      "Member profiles",
      "Notifications and mentions",
      "Mobile app",
    ],
  },
  {
    title: "Considering",
    status: "Considering",
    dot: "bg-muted-foreground/40",
    items: [
      "Reactions and emoji",
      "Voice channels",
      "Advanced analytics",
      "Public API and webhooks",
    ],
  },
];

const STATUS_STYLE: Record<Status, string> = {
  "In progress": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Planned: "bg-primary/15 text-primary",
  Considering: "bg-muted text-muted-foreground",
};

function RoadmapPage() {
  return (
    <>
      <PageHeader badge="Product" title="Roadmap" subtitle="Where adda is headed next." />
      <section className="py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-4 flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h2 className="font-semibold">{col.title}</h2>
                  <Badge variant="secondary">{col.items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {col.items.map((item) => (
                    <Card
                      key={item}
                      className="p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <p className="text-sm font-medium">{item}</p>
                      <Badge className={`mt-3 ${STATUS_STYLE[col.status]}`} variant="secondary">
                        {col.status}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs text-muted-foreground">
            This is a living document — priorities may shift as we learn from you.
          </p>
        </Container>
      </section>
    </>
  );
}
