import { icons } from "../components.mjs";
import { input } from "../shells.mjs";

const card = (title, sub, body) =>
  `<div class="panel" style="width:380px;padding:24px"><div class="eyebrow" style="margin-bottom:10px">${sub}</div><h2 class="h2">${title}</h2>${body}</div>`;

export default {
  w: 1440,
  h: 640,
  html: `<div style="padding:40px 48px"><div class="brand" style="font-size:20px;margin-bottom:28px">${icons.radio(22)}<span>adda</span></div>
    <div style="display:flex;gap:24px;align-items:flex-start">
      ${card("Reset your password", "1 · Request", `<p class="muted" style="margin:6px 0 18px;font-size:13px">We will email you a link that works for 30 minutes.</p><div style="display:flex;flex-direction:column;gap:14px">${input("Email", "rafi@example.com", { focus: true })}<span class="btn primary" style="height:36px;justify-content:center">Send reset link</span></div>`)}
      ${card("Check your inbox", "2 · Sent", `<p class="muted" style="margin:6px 0 18px;font-size:13px">If an account exists for <b style="color:var(--fg)">rafi@example.com</b>, a reset link is on its way. It can take a minute.</p><div class="banner">${icons.check(14)}<span>Link valid for <span class="mono">30:00</span></span></div><p class="subtle" style="font-size:12px;margin-top:14px">Nothing arrived? Check spam, or ask the person who runs this server.</p>`)}
      ${card("Choose a new password", "3 · Reset", `<p class="muted" style="margin:6px 0 18px;font-size:13px">Pick something you do not use anywhere else.</p><div style="display:flex;flex-direction:column;gap:14px">${input("New password", "", { type: "password", help: "At least 8 characters." })}${input("Confirm password", "", { type: "password" })}<span class="btn primary" style="height:36px;justify-content:center">Save password</span></div>`)}
    </div>
    <div style="display:flex;gap:24px;margin-top:24px">
      <div class="banner err" style="width:380px">${icons.lock(14)}<span>This link has expired or was already used. <span style="color:var(--accent)">Request a new one</span></span></div>
      <div class="banner warn" style="width:380px"><span>Email is not set up on this server, so reset links can't be sent. Ask the host to reset your password.</span></div>
    </div></div>`,
};
