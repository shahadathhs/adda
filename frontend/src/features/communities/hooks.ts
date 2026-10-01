import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommunity,
  followCommunity,
  getCommunity,
  getFollowState,
  getStreamKey,
  joinCommunity,
  listCommunities,
  listFollowed,
  listMembers,
  rotateStreamKey,
  unfollowCommunity,
  updateCommunity,
} from "./api";
import type { Community, StreamCredentials } from "./types";

export const communitiesKeys = {
  all: ["communities"] as const,
  lists: () => [...communitiesKeys.all, "list"] as const,
  list: () => [...communitiesKeys.lists(), "all"] as const,
  details: () => [...communitiesKeys.all, "detail"] as const,
  detail: (id: string) => [...communitiesKeys.details(), id] as const,
  streamKey: (id: string) => [...communitiesKeys.all, "stream-key", id] as const,
  follow: (id: string) => [...communitiesKeys.all, "follow", id] as const,
  followed: () => [...communitiesKeys.all, "followed"] as const,
};

export const useCommunities = () =>
  useQuery({ queryKey: communitiesKeys.list(), queryFn: listCommunities });

export const useCommunity = (id: string) =>
  useQuery({
    queryKey: communitiesKeys.detail(id),
    queryFn: () => getCommunity(id),
  });

export const useStreamKey = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: communitiesKeys.streamKey(id),
    queryFn: () => getStreamKey(id),
    enabled,
  });

export const useCreateCommunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createCommunity>[0]) => createCommunity(data),
    onSuccess: (c: Community) => {
      qc.setQueryData<Community[]>(communitiesKeys.list(), (old) => [c, ...(old ?? [])]);
    },
  });
};

export const useRotateStreamKey = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => rotateStreamKey(id),
    onSuccess: (creds: StreamCredentials) => {
      qc.setQueryData(communitiesKeys.streamKey(id), creds);
    },
  });
};

export const useUpdateCommunity = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Community>) => updateCommunity(id, data),
    onSuccess: (c: Community) => {
      qc.setQueryData(communitiesKeys.detail(id), c);
      qc.invalidateQueries({ queryKey: communitiesKeys.lists() });
      qc.invalidateQueries({ queryKey: ["discover"] });
    },
  });
};

export const useFollowState = (id: string, enabled: boolean) =>
  useQuery({
    queryKey: communitiesKeys.follow(id),
    queryFn: () => getFollowState(id),
    enabled,
  });

export const useSetFollowed = (id: string) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: communitiesKeys.follow(id) });
    qc.invalidateQueries({ queryKey: communitiesKeys.detail(id) });
    qc.invalidateQueries({ queryKey: communitiesKeys.followed() });
    qc.invalidateQueries({ queryKey: ["discover"] });
  };
  const follow = useMutation({ mutationFn: () => followCommunity(id), onSuccess: invalidate });
  const unfollow = useMutation({ mutationFn: () => unfollowCommunity(id), onSuccess: invalidate });
  return { follow, unfollow };
};

export const useFollowedCommunities = () =>
  useQuery({ queryKey: communitiesKeys.followed(), queryFn: listFollowed });

export function useMembers(communityId: string | undefined) {
  return useQuery({
    queryKey: ["members", communityId],
    queryFn: () => listMembers(communityId!),
    enabled: !!communityId,
  });
}

export function useJoinCommunity(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => joinCommunity(communityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", communityId] });
    },
  });
}
