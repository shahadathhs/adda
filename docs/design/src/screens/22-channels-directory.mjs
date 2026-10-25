import { channelCard } from "../components.mjs";
import { directory } from "../directory.mjs";
import { channels } from "../data.mjs";

export default {
  w: 1440,
  h: 1440,
  html: directory({
    active: "channels",
    eyebrow: "Channels",
    title: "All channels",
    sub: '<span class="num">91</span> matching channels',
    filter: {},
    cards: channels.map(channelCard).join(""),
    range: "1–12 of 91",
    pages: [1, 2, "…", 8],
    h: 1440,
  }),
};
