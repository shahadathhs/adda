import { authShell, input } from "../shells.mjs";

export default {
  w: 1440,
  h: 900,
  html: authShell(`<div style="width:360px">
    <h1 class="h1">Welcome back</h1><p class="muted" style="margin-top:4px">Sign in to chat, follow and get alerts.</p>
    <div style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
      ${input("Email", "rafi@example.com", { focus: true })}
      ${input("Password", "", { type: "password" })}
      <div style="display:flex;justify-content:space-between;align-items:center"><span class="muted" style="font-size:13px"></span><span style="color:var(--accent);font-size:13px">Forgot password?</span></div>
      <span class="btn primary" style="height:36px;justify-content:center">Sign in</span>
    </div>
    <p class="muted" style="margin-top:20px;font-size:13px;text-align:center">No account yet? <span style="color:var(--accent)">Create one</span></p>
    <div class="sep"></div>
    <p class="subtle" style="font-size:12px;text-align:center">Just looking? You can watch any public channel without an account.</p>
  </div>`),
};
