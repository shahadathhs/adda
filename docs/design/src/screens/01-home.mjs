import { shell } from "../shells.mjs";
import { homeBody } from "../home.mjs";

export default {
  w: 1440,
  h: 1720,
  html: shell({ active: "", notif: true }, homeBody(), { h: 1720 }),
};
