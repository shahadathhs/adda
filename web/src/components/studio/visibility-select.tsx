import type { Video } from "@/lib/types";

const OPTIONS: { value: Video["visibility"]; label: string }[] = [
  { value: "public", label: "Public: listed on the channel and in search" },
  { value: "unlisted", label: "Unlisted: anyone with the link" },
  { value: "private", label: "Private: only you" },
];

/** Who can watch a video. */
export function VisibilitySelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Video["visibility"];
  onChange: (value: Video["visibility"]) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Video["visibility"])}
      className="h-9 w-full rounded-sm border border-input bg-input/50 px-2 text-sm text-foreground"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
