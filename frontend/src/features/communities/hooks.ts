import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommunity,
  getCommunity,
  getStreamKey,
  listCommunities,
  rotateStreamKey,
} from "./api";
import type { Community, StreamCredentials } from "./types";

export const communitiesKeys = {
  all: ["communities"] as const,
  lists: () => [...communitiesKeys.all, "list"] as const,
  list: () => [...communitiesKeys.lists(), "all"] as const,
  details: () => [...communitiesKeys.all, "detail"] as const,
  detail: (id: string) => [...communitiesKeys.details(), id] as const,
  streamKey: (id: string) => [...communitiesKeys.all, "stream-key", id] as const,
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
