/** A real screenshot of the app in a plain 1px frame (no fake browser chrome). */
export function Screen({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={1440}
      height={900}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`h-auto w-full rounded-lg border border-border ${className}`}
    />
  );
}
