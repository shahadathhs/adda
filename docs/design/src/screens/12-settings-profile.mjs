import { icons, avatar, msg } from "../components.mjs";
import { settingsShell, input } from "../shells.mjs";

export default {
  w: 1440,
  h: 1260,
  html: settingsShell(
    "profile",
    `
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start">
      <section><h2 class="h2">Profile</h2>
        <div class="panel" style="margin-top:12px;display:flex;flex-direction:column;gap:16px">
          <div class="row">${avatar("Rafi Ahmed", 64)}<div><div class="row" style="gap:8px"><span class="btn secondary">Upload picture</span><span class="btn ghost">Remove</span></div><div class="help">PNG, JPEG or WebP, up to 2 MB.</div></div></div>
          ${input("Display name", "Rafi Ahmed")}
          ${input("Username", "rafi", { help: "Used in @mentions and your profile link." })}
          <div><label class="l">Bio</label><div class="in" style="height:68px;align-items:flex-start;padding-top:10px">Radio hobbyist. Learning to solder.</div><div class="help"><span class="num">36</span>/280</div></div>
          <div style="display:flex;justify-content:flex-end"><span class="btn primary">Save changes</span></div>
        </div></section>
      <div style="display:flex;flex-direction:column;gap:24px">
        <section><h2 class="h2">Status</h2>
          <div class="panel" style="margin-top:12px;display:flex;flex-direction:column;gap:14px">
            <div><label class="l">What's happening?</label><div class="in ph"><span style="flex:1">Back at 6, streaming the radio build</span></div><div class="help num">0/80</div></div>
            <div class="row" style="gap:6px">${["☕", "🎧", "🛠️", "📚", "🌙", "✈️", "🤒", "🎉"].map((e, i) => `<span style="width:36px;height:36px;border-radius:4px;border:1px solid ${i === 0 ? "var(--accent)" : "var(--line)"};background:${i === 0 ? "var(--input)" : "var(--bg)"};display:grid;place-items:center;font-size:16px">${e}</span>`).join("")}</div>
            <div><label class="l">Clear status</label><div class="in" style="justify-content:space-between"><span>Don't clear</span>${icons.chevd(14)}</div></div>
            <div style="display:flex;justify-content:flex-end"><span class="btn primary">Set status</span></div>
          </div></section>
        <section><h2 class="h2">How you appear in chat</h2>
          <div class="panel" style="margin-top:12px">
            <div class="seg"><span class="on">Show my name</span><span>Appear as Anonymous</span></div>
            <p class="muted" style="margin-top:12px;font-size:13px">Anonymous hides your name from other viewers. Your messages are still recorded against your account, and the channel owner, its moderators and the server admin can see who is behind them.</p>
            <div class="sep"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
              <div class="panel" style="padding:10px;background:var(--bg)"><div class="subtle" style="font-size:12px;margin-bottom:6px">Show my name</div>${msg({ user: "rafi", color: "#f5a623", text: "thanks both" })}</div>
              <div class="panel" style="padding:10px;background:var(--bg)"><div class="subtle" style="font-size:12px;margin-bottom:6px">Anonymous</div>${msg({ user: "Anonymous", text: "thanks both", anon: true })}</div>
            </div>
          </div></section>
        <section><h2 class="h2">Password</h2>
          <div class="panel" style="margin-top:12px;display:flex;flex-direction:column;gap:14px">
            ${input("Current password", "", { type: "password" })}${input("New password", "", { type: "password", help: "At least 8 characters." })}${input("Confirm new password", "", { type: "password" })}
            <div style="display:flex;justify-content:flex-end"><span class="btn secondary">Change password</span></div>
          </div></section>
      </div>
    </div>`,
    { h: 1260 },
  ),
};
