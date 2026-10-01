import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";

export function useChannels(communityId: string | undefined) {
  return useQuery({
    queryKey: ["channels", communityId],
    queryFn: () => api.listChannels(communityId!),
    enabled: !!communityId,
  });
}

export function useChannelMessages(communityId: string | undefined, channelId: string | undefined) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => api.listMessages(communityId!, channelId!),
    enabled: !!communityId && !!channelId,
  });
}

export function useCreateChannel(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; type?: string; is_restricted?: boolean }) =>
      api.createChannel(communityId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels", communityId] }),
  });
}

export function useUpdateChannel(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      channelId,
      data,
    }: {
      channelId: string;
      data: { name?: string; position?: number; is_restricted?: boolean };
    }) => api.updateChannel(communityId, channelId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels", communityId] }),
  });
}

export function useDeleteChannel(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => api.deleteChannel(communityId, channelId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channels", communityId] }),
  });
}

export function useChannelMembers(communityId: string, channelId: string | undefined) {
  return useQuery({
    queryKey: ["channel-members", channelId],
    queryFn: () => api.listChannelMembers(communityId, channelId!),
    enabled: !!channelId,
  });
}
