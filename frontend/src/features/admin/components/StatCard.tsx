import { Card } from "@/shared/ui/card";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
