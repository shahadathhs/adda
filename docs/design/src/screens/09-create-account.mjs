import { authShell, input } from "../shells.mjs";

export default {
  w: 1440,
  h: 900,
  html: authShell(`<div style="width:360px">
    <h1 class="h1">Create your account</h1><p class="muted" style="margin-top:4px">An account is needed to chat, react, vote and follow.</p>
    <div style="display:flex;flex-direction:column;gap:16px;margin-top:24px">
      ${input("Username", "nila", { err: true, help: "That username is taken. Try nila_workshop." })}
      ${input("Display name", "Nila Rahman")}
      ${input("Email", "nila@example.com")}
      ${input("Password", "", { type: "password", help: "At least 8 characters." })}
      <span class="btn primary" style="height:36px;justify-content:center">Create account</span>
    </div>
    <p class="muted" style="margin-top:20px;font-size:13px;text-align:center">Already registered? <span style="color:var(--accent)">Sign in</span></p>
  </div>`),
};
