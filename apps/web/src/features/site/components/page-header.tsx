import { Badge } from "@/shared/ui/badge";
import { Container } from "@/shared/ui/container";

/** Hero header for inner pages — full-width band with a subtle brand glow. */
export function PageHeader({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_0%,hsl(var(--primary)/0.16),transparent)]"
      />
      <Container className="relative py-16 text-center sm:py-20">
        {badge && (
          <Badge variant="secondary" className="mb-4">
            {badge}
          </Badge>
        )}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        )}
      </Container>
    </section>
  );
}
