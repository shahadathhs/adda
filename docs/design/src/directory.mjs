import { shell } from "./shells.mjs";
import { filterBar, pager } from "./components.mjs";

/** A directory page: eyebrow, H1, count, filter bar, card grid, numbered pagination, footer. */
export function directory({
  active,
  eyebrow,
  title,
  sub,
  filter,
  cards,
  range,
  pages,
  h,
  user = true,
}) {
  return shell(
    { active, notif: user, user },
    `<div class="col" style="padding-top:28px">
      <div class="eyebrow">${eyebrow}</div>
      <h1 class="h1" style="margin-top:2px">${title}</h1>
      <div class="muted" style="margin-top:4px;font-size:13px">${sub}</div>
      <div style="margin-top:20px">${filterBar(filter)}</div>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:16px">${cards}</div>
      ${pager(range, pages)}
    </div>`,
    { h, footer: true },
  );
}
