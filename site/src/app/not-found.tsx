import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Not found
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
        There is nothing at that address.
      </h1>
      <p className="mt-3 text-muted-foreground">
        The page may have moved. Try the{" "}
        <Link href="/docs/quickstart" className="text-primary underline underline-offset-4">
          documentation
        </Link>{" "}
        or go back to the{" "}
        <Link href="/" className="text-primary underline underline-offset-4">
          home page
        </Link>
        .
      </p>
    </main>
  );
}
