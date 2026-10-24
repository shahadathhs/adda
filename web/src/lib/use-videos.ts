"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { browseVideos, channelVideos, getVideo } from "@/lib/api";
import { mediaUrl } from "@/lib/media-url";
import type { Video, VideoQuery } from "@/lib/types";
import { getToken } from "@/lib/api";

export const videoKeys = {
  channel: (communityId: string) => ["videos", "channel", communityId] as const,
  one: (id: string) => ["videos", "one", id] as const,
};

/** A channel's videos: the public ones, or all of them for the owner. Polls while one is preparing. */
export function useChannelVideos(communityId: string) {
  return useQuery({
    queryKey: videoKeys.channel(communityId),
    queryFn: () => channelVideos(communityId),
    refetchInterval: (q) => (q.state.data?.some((v) => v.status === "processing") ? 3000 : false),
  });
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: videoKeys.one(id),
    queryFn: () => getVideo(id),
    refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false),
  });
}

export function useBrowseVideos(query: VideoQuery, enabled = true) {
  return useQuery({
    queryKey: ["browse", "videos", query],
    queryFn: () => browseVideos(query),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Where to load a video's file or poster. Unlisted and private videos need the viewer's token in the URL. */
export function videoMediaUrl(video: Video, kind: "file" | "poster"): string | null {
  const path = kind === "file" ? video.file_url : video.poster_url;
  const url = mediaUrl(path);
  if (!url || video.visibility === "public") return url;
  const token = typeof window === "undefined" ? null : getToken();
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}
