import { videoCard } from "../components.mjs";
import { directory } from "../directory.mjs";
import { videos } from "../data.mjs";

export default {
  w: 1440,
  h: 1440,
  html: directory({
    active: "videos",
    eyebrow: "Videos",
    title: "All videos",
    sub: '<span class="num">38</span> matching videos, uploaded by channel owners',
    filter: { q: "radio", show: "All channels", sort: "Newest first", clear: true },
    cards: [...videos, ...videos.slice(0, 4)].map(videoCard).join(""),
    range: "1–12 of 38",
    pages: [1, 2, 3, 4],
    h: 1440,
  }),
};
