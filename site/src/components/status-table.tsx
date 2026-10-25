"use client";

import { Check, Clock } from "lucide-react";
import * as m from "motion/react-m";

const row = { hidden: { opacity: 0 }, show: { opacity: 1 } };
const mark = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
  },
};

/**
 * What is built, as a table. The rows arrive one after another (35 ms apart) and a check mark
 * settles beside each finished item; an item still to measure gets a clock instead.
 */
export function StatusTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <m.tbody
          data-reveal
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ staggerChildren: 0.035 }}
        >
          {rows.map(([what, state]) => {
            const done = state.startsWith("Built");
            const pending = /still to measure|not yet/i.test(state);
            return (
              <m.tr
                key={what}
                variants={row}
                className="border-b border-border transition-colors duration-[120ms] last:border-b-0 hover:bg-secondary/50"
              >
                <td className="px-5 py-3 text-foreground">{what}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  <span className="flex items-start gap-2">
                    <m.span variants={mark} className="mt-0.5 shrink-0" aria-hidden="true">
                      {done && !pending ? (
                        <Check className="h-4 w-4 text-ok" />
                      ) : (
                        <Clock className="h-4 w-4 text-primary" />
                      )}
                    </m.span>
                    {state}
                  </span>
                </td>
              </m.tr>
            );
          })}
        </m.tbody>
      </table>
    </div>
  );
}
