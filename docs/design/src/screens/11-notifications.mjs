import { topbar, avatar, icons, scene, streamCard } from "../components.mjs";

const T = {
  amber: ["rgba(245,166,35,.14)", "#f5a623"],
  pink: ["rgba(214,122,177,.16)", "#d67ab1"],
  blue: ["rgba(90,169,230,.16)", "#5aa9e6"],
};
const n = (unread, who, tone, body, time, tag) =>
  `<div class="notif ${unread ? "unread" : ""}">${avatar(who, 32, tone)}<div style="flex:1;min-width:0;font-size:13px;line-height:18px"><div>${body}</div><div class="subtle" style="font-size:12px;margin-top:2px"><span class="num">${time}</span> · ${tag}</div></div>${unread ? '<i style="width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:6px"></i>' : ""}</div>`;

export default {
  w: 1440,
  h: 900,
  html: `${topbar({ active: "", notif: true })}
  <div class="col" style="padding-top:24px;opacity:.45"><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px">
    ${streamCard({ kind: "radio", title: "Late night requests · open lines", channel: "latenight_radio", viewers: "1,402", tone: T.pink })}
    ${streamCard({ kind: "bench", title: "Restoring the 1974 radio, part 3", channel: "nila_workshop", viewers: "312", tone: T.amber })}
    ${streamCard({ kind: "code", title: "Writing a tiny HTTP server in Zig", channel: "dhaka_dev_chat", viewers: "276", tone: T.blue })}
    ${streamCard({ kind: "chess", title: "Rook endgames, slowly", channel: "kodomo_chess", viewers: "88", tone: T.amber })}
  </div></div>
  <div class="menu" style="right:104px;top:60px;width:400px">
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line)"><b style="font-weight:600">Notifications <span class="num muted" style="font-weight:500">3 new</span></b><span style="color:var(--accent);font-size:13px">Mark all read</span></div>
    ${n(true, "nila_workshop", T.amber, "<b>nila_workshop</b> is live: Restoring the 1974 radio, part 3", "2m ago", "went live")}
    ${n(true, "sadia", T.blue, "<b>sadia</b> mentioned you: “@rafi you asked about the 6V6 earlier…”", "8m ago", "mention · nila_workshop")}
    ${n(true, "tania_r", T.pink, "<b>tania_r</b> replied to your message in <b>kodomo_chess</b>", "1h ago", "reply")}
    ${n(false, "latenight_radio", T.pink, "<b>latenight_radio</b> went live: Late night requests", "Yesterday", "went live")}
    ${n(false, "mehedi", T.blue, '<b>mehedi</b> commented on your recording at <span class="mono" style="color:var(--accent)">00:22:05</span>', "2d ago", "comment")}
    <div style="padding:10px 14px;text-align:center;font-size:13px;color:var(--fg-muted)">Notification settings</div>
  </div>`,
};
