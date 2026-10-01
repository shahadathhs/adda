import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Container } from "@/shared/ui/container";
import { PageHeader } from "@/features/site/components/page-header";

export const Route = createFileRoute("/_public/status")({
  head: () => ({
    title: "Status — adda",
    meta: [
      { name: "description", content: "Service status and uptime for adda." },
      { property: "og:title", content: "Status — adda" },
      { property: "og:description", content: "Service status and uptime for adda." },
    ],
  }),
  component: StatusPage,
});

const SERVICES = ["Live streaming", "Realtime chat", "Web application", "API", "Recordings"];
const DAYS = 60;

function StatusPage() {
  return (
    <>
      <PageHeader
        badge="Product"
        title="System status"
        subtitle="Current health of adda, updated in real time."
      />
      <section className="py-16">
        <Container>
          <Card className="flex items-center gap-4 bg-emerald-500/10 p-6">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                All systems operational
              </p>
              <p className="text-sm text-muted-foreground">Updated just now.</p>
            </div>
          </Card>

          <div className="mt-10 divide-y divide-border rounded-xl border border-border">
            {SERVICES.map((s) => (
              <div key={s} className="px-5 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium">{s}</span>
                  <span className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: DAYS }).map((_, i) => (
                    <span
                      key={i}
                      className="h-8 flex-1 rounded-sm bg-emerald-500/60 transition-colors hover:bg-emerald-500"
                      title="Operational"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <span>{DAYS} days ago</span>
            <span>Today</span>
          </div>

          <h2 className="mt-14 text-lg font-semibold">Past incidents</h2>
          <p className="mt-2 text-sm text-muted-foreground">None in the last 90 days. 🎉</p>
        </Container>
      </section>
    </>
  );
}
