import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "./cn";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 border-b border-line bg-panel px-2.5 py-1.5 text-left",
        "text-2xs font-semibold uppercase tracking-wider text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-line/50 px-2.5 py-1.5 align-middle", className)}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-panel2/70", className)} {...props} />;
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <Td colSpan={colSpan} className="py-8 text-center text-muted">
        {label}
      </Td>
    </tr>
  );
}
