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

const line = (n: number, a: ReturnType<typeof author>, content: string): ChatMessage => ({
  id: `m-${n}`,
  channel: "community/c-1/chat",
  community_id: "c-1",
  author: a,
  content,
  created_at: `2026-10-24T18:${10 + n}:00Z`,
  reply_to: null,
});

export const fixtureChat: ChatMessage[] = [
  line(1, author("u1", "joy_k"), "is that a Philips? the dial looks right"),
  line(2, author("u2", "imran"), "we need a close-up of the transformer"),
  line(3, author("u3", "mehedi", ["follower"]), "that hum is the filter cap, 100%"),
  line(4, author("u4", "tania_r"), "new here, loving the pace"),
  line(5, author("o", "nila_workshop", ["owner"]), "Welcome Tania! Chai is mandatory in here."),
  line(6, author(null, ""), "can you show the schematic again?"),
  line(7, author("u5", "sadia", ["moderator", "follower"]), "she covered it at 02:40"),
  line(8, author("u-rafi", "rafi"), "thanks both, rewinding now"),
];
