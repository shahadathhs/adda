import { icons, avatar, msg } from "../components.mjs";
import { settingsShell, input } from "../shells.mjs";

export default {
  w: 1440,
  h: 1060,
  html: settingsShell(
    "profile",
    `
    <h2 class="h2">Profile</h2>
    <div class="panel" style="margin-top:16px;display:flex;flex-direction:column;gap:16px">
      <div class="row">${avatar("Rafi Ahmed", 64)}<div><span class="btn secondary">Upload picture</span><div class="help">PNG or JPG, up to 2 MB.</div></div></div>
      ${input("Display name", "Rafi Ahmed")}
      ${input("Username", "rafi", { help: "Used in @mentions and your profile link." })}
      <div><label class="l">Bio</label><div class="in" style="height:68px;align-items:flex-start;padding-top:10px">Radio hobbyist. Learning to solder.</div><div class="help"><span class="num">36</span>/280</div></div>
      <div style="display:flex;justify-content:flex-end"><span class="btn primary">Save changes</span></div>
    </div>

    <h2 class="h2" style="margin-top:32px">How you appear in chat</h2>
    <div class="panel" style="margin-top:16px">
      <div class="seg"><span class="on">Show my name</span><span>Appear as Anonymous</span></div>
      <p class="muted" style="margin-top:12px;font-size:13px;max-width:560px">Anonymous hides your name from other viewers. Your messages, reactions and votes are still recorded against your account, and the channel owner, its moderators and the server admin can see who is behind them.</p>
      <div class="sep"></div>
      <div class="eyebrow" style="margin-bottom:10px">Preview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px">
        <div class="panel" style="padding:12px;background:var(--bg)"><div class="subtle" style="font-size:12px;margin-bottom:6px">Show my name</div>${msg({ user: "rafi", color: "#f5a623", text: "thanks both, rewinding now" })}</div>
        <div class="panel" style="padding:12px;background:var(--bg)"><div class="subtle" style="font-size:12px;margin-bottom:6px">Anonymous</div>${msg({ user: "Anonymous", text: "thanks both, rewinding now", anon: true })}</div>
      </div>
    </div>`,
    { h: 1004 },
  ),
};
