import { icons } from "../components.mjs";
import { authShell, input } from "../shells.mjs";

const card = (title, sub, body) =>
  `<div class="panel" style="padding:20px"><div class="eyebrow" style="margin-bottom:8px">${sub}</div><h2 class="h3">${title}</h2>${body}</div>`;

export default {
  w: 1440,
  h: 1120,
  html: authShell(
    `<div style="width:600px">
    <h1 class="h1">Reset your password</h1><p class="muted" style="margin-top:4px;margin-bottom:20px">The three steps, and the two ways a link can fail.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
      ${card("Request a link", "1 · Request", `<p class="muted" style="margin:6px 0 14px;font-size:13px">We will email you a link that works for 30 minutes.</p><div style="display:flex;flex-direction:column;gap:12px">${input("Email", "rafi@example.com", { focus: true })}<span class="btn primary" style="height:36px;justify-content:center">Send reset link</span></div>`)}
      ${card("Check your inbox", "2 · Sent", `<p class="muted" style="margin:6px 0 14px;font-size:13px">If an account exists for <b style="color:var(--fg)">rafi@example.com</b>, a link is on its way.</p><div class="banner">${icons.check(14)}<span>Link valid for <span class="mono">30:00</span></span></div><p class="subtle" style="font-size:12px;margin-top:12px">Nothing arrived? Check spam, or ask the person who runs this server.</p>`)}
      ${card("Choose a new password", "3 · Reset", `<p class="muted" style="margin:6px 0 14px;font-size:13px">Pick something you do not use anywhere else.</p><div style="display:flex;flex-direction:column;gap:12px">${input("New password", "", { type: "password", help: "At least 8 characters." })}${input("Confirm password", "", { type: "password" })}<span class="btn primary" style="height:36px;justify-content:center">Save password</span></div>`)}
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="banner err">${icons.lock(14)}<span>This link has expired or was already used. <span style="color:var(--accent)">Request a new one</span></span></div>
        <div class="banner warn"><span>Email is not set up on this server, so reset links can't be sent. Ask the host to reset your password.</span></div>
      </div>
    </div></div>`,
  ),
};
