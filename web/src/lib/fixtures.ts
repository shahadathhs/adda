import type {
  ChatMessage,
  Community,
  DiscoverChannel,
  Recording,
  RecordingFeedItem,
  StreamStatus,
  User,
} from "@/lib/types";

/** Invented data for the /design preview routes (development only). */
export const fixtureUser: User = {
  id: "u-rafi",
  username: "rafi",
  email: "rafi@example.com",
  display_name: "Rafi Ahmed",
  avatar_url: null,
  bio: null,
  system_role: "user",
  identity_mode: "named",
  status: null,
};

const channel = (
  i: number,
  name: string,
  title: string | null,
  live: boolean,
  viewers: number,
  followers: number,
  description: string | null = null,
): DiscoverChannel => ({
  community_id: `c-${i}`,
  name,
  slug: name.replace(/_/g, "-"),
  description,
  avatar_url: null,
  banner_url: null,
  stream_title: title,
  is_live: live,
  viewers,
  started_at: live ? new Date(Date.now() - (3 * 3600 + 41 * 60 + 8) * 1000).toISOString() : null,
  follower_count: followers,
  hls_url: null,
  webrtc_url: null,
});

export const fixtureChannels: DiscoverChannel[] = [
  channel(
    1,
    "nila_workshop",
    "Sunday build: restoring the 1974 radio, part 3",
    true,
    312,
    4812,
    "Re-capping the power supply and finding out why the left channel hums. Questions welcome in chat.",
  ),
  channel(2, "latenight_radio", "Late night requests · open lines", true, 1402, 9120),
  channel(3, "dhaka_dev_chat", "Writing a tiny HTTP server in Zig", true, 276, 2210),
  channel(4, "kodomo_chess", "Rook endgames, slowly (beginners)", true, 88, 640),
  channel(5, "tuesday_tabletop", "Tuesday tabletop: the sunken keep", true, 64, 405),
  channel(6, "bench_notes", null, false, 0, 118),
  channel(7, "rooftop_garden", null, false, 0, 77),
];

export const fixtureFollowed: Community[] = [
  "nila_workshop",
  "latenight_radio",
  "kodomo_chess",
  "bench_notes",
].map((name, i) => ({
  id: `c-${[1, 2, 4, 6][i]}`,
  name,
  slug: name.replace(/_/g, "-"),
  description: null,
  banner_url: null,
  avatar_url: null,
  is_private: false,
  stream_title: null,
  owner_id: "o",
  follower_count: 0,
  is_live: i < 3,
}));

const recording = (i: number, c: DiscoverChannel, title: string): RecordingFeedItem => ({
  community_id: c.community_id,
  name: `2026-10-2${i}T18-30-00-${title.replace(/ /g, "-")}.mp4`,
  path: `/r/${i}`,
  size_bytes: 1,
  created_at: `2026-10-2${i}T18:30:00Z`,
  community_name: c.name,
  community_slug: c.slug,
});

export const fixtureRecordings: RecordingFeedItem[] = [
  recording(1, fixtureChannels[0], "Sunday build the stack"),
  recording(2, fixtureChannels[3], "Endgames slowly"),
  recording(3, fixtureChannels[2], "Zig HTTP server part 1"),
  recording(4, fixtureChannels[4], "The sunken keep session 4"),
];

export const fixtureCommunity = (live: boolean): Community => ({
  id: "c-1",
  name: "nila_workshop",
  slug: "nila-workshop",
  description:
    "Slow repairs of old radios, record players and the odd tape deck. New stream most Sundays. Be kind in chat; ask anything about capacitors.",
  banner_url: null,
  avatar_url: null,
  is_private: false,
  stream_title: "Sunday build: restoring the 1974 radio, part 3",
  owner_id: "o",
  follower_count: 4812,
  is_live: live,
});

export const fixtureStatus = (live: boolean): StreamStatus => ({
  is_live: live,
  viewers: live ? 312 : 0,
  started_at: live ? new Date(Date.now() - (3 * 3600 + 41 * 60 + 8) * 1000).toISOString() : null,
  hls_url: "",
  rtmp_ingest_url: "",
});

export const fixtureChannelRecordings: Recording[] = [
  "Sunday build: the stack",
  "Restoring the 1974 radio, part 2",
  "Tape deck teardown",
].map((title, i) => ({
  community_id: "c-1",
  name: `2026-10-${20 - i * 5}T18-30-00-${title.replace(/[ :,]+/g, "-")}.mp4`,
  path: `/r/${i}`,
  size_bytes: 1_204_000_000 + i * 700_000_000,
  created_at: `2026-10-${20 - i * 5}T18:30:00Z`,
}));

const author = (
  id: string | null,
  name: string,
  badges: ("owner" | "moderator" | "follower")[] = [],
) => ({
  id,
  username: id ? name : null,
  display_name: id ? name : "Anonymous",
  avatar_url: null,
  badges,
});

const line = (
  n: number,
  a: ReturnType<typeof author>,
  content: string,
  extra: Partial<ChatMessage> = {},
): ChatMessage => ({
  id: `m-${n}`,
  channel: "community/c-1/chat",
  community_id: "c-1",
  author: a,
  content,
  created_at: `2026-10-24T18:${10 + n}:00Z`,
  reply_to: null,
  reply: null,
  mentions: [],
  reactions: {},
  ...extra,
});

export const fixtureChat: ChatMessage[] = [
  line(1, author("u1", "joy_k"), "is that a Philips? the dial looks right"),
  line(2, author("u2", "imran"), "we need a close-up of the transformer", {
    reactions: { "👍": 7 }, // design-ok: user reaction content
  }),
  line(3, author("u3", "mehedi", ["follower"]), "that hum is the filter cap, 100%"),
  line(4, author("u4", "tania_r"), "new here, loving the pace :chai:", {
    reactions: { "👍": 4, "☕": 2 }, // design-ok: user reaction content
    my_reactions: ["☕"],
  }),
  line(5, author("o", "nila_workshop", ["owner"]), "Welcome Tania! Chai is mandatory in here.", {
    reply_to: "m-4",
    reply: {
      id: "m-4",
      deleted: false,
      content: "new here, loving the pace",
      author: author("u4", "tania_r"),
    },
  }),
  line(6, author(null, ""), "can you show the schematic again?"),
  line(
    7,
    author("u5", "sadia", ["moderator", "follower"]),
    "@rafi you asked about the 6V6 earlier, she covered it at 02:40",
    {
      mentions: ["u-rafi"],
    },
  ),
  line(8, author("u-rafi", "rafi"), "thanks both, rewinding now"),
];

export const fixturePoll = {
  id: "p-1",
  community_id: "c-1",
  question: "What should we fix first?",
  status: "open" as const,
  closes_at: new Date(Date.now() + 2 * 60_000 + 10_000).toISOString(),
  total: 186,
  my_vote: null,
  options: [
    { id: "o1", label: "Left-channel hum", votes: 108, percent: 58 },
    { id: "o2", label: "Dial lamp", votes: 50, percent: 27 },
    { id: "o3", label: "Tuning cord", votes: 28, percent: 15 },
  ],
};

export const fixturePinned = {
  author: author("o", "nila_workshop", ["owner"]),
  content:
    "Today: new power supply, then the left-channel hum. Stream key leaks go to the mods, not chat.",
};

export const fixtureEmotes = [{ name: "chai", url: "/emote-chai.svg" }];

export const fixtureCreds = {
  stream_url: "rtmp://live.nilaworkshop.example:1935/community/c-1?key=8f3a1c9d27b64e05a1d9c3e7",
  stream_key: "8f3a1c9d27b64e05a1d9c3e7",
};

export const fixtureHealth = {
  community_id: "c-1",
  is_live: true,
  viewers: 312,
  started_at: new Date(Date.now() - (3 * 3600 + 41 * 60 + 8) * 1000).toISOString(),
  uptime_seconds: 3 * 3600 + 41 * 60 + 8,
  video_codec: "H264",
  audio_codec: "AAC",
};

export const fixtureModerators = [
  {
    user_id: "u5",
    username: "sadia",
    display_name: "Sadia",
    avatar_url: null,
    since: "2026-04-02T00:00:00Z",
  },
  {
    user_id: "u3",
    username: "mehedi",
    display_name: "Mehedi",
    avatar_url: null,
    since: "2026-03-11T00:00:00Z",
  },
];

export const fixtureFollowers = ["tania_r", "tanvir", "imran", "joy_k"].map((u, i) => ({
  id: `f${i}`,
  username: u,
  display_name: u,
  avatar_url: null,
  since: "2026-10-01T00:00:00Z",
}));
