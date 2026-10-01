import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <p className="font-mono text-4xl font-bold text-muted-foreground/40">404</p>
      <p className="text-sm text-muted-foreground">That page or channel doesn&apos;t exist.</p>
      <Link href="/" className="text-primary hover:underline">
        ← Back to Browse
      </Link>
    </div>
  );
}
