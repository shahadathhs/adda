/** `text` with the first match of `q` emphasised. */
export function Highlight({ text, q }: { text: string; q: string }) {
  const at = q ? text.toLowerCase().indexOf(q.trim().toLowerCase()) : -1;
  if (at < 0 || !q.trim()) return <>{text}</>;
  const end = at + q.trim().length;
  return (
    <>
      {text.slice(0, at)}
      <span className="font-semibold text-foreground">{text.slice(at, end)}</span>
      {text.slice(end)}
    </>
  );
}
