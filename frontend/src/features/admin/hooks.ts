import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCommunities,
  adminCommunityMembers,
  adminCommunityStreamKey,
  adminDeleteCommunity,
  adminDeleteRecording,
  adminDeleteUser,
  adminKickMember,
  adminLive,
  adminRecordings,
  adminResetUserPassword,
  adminRotateCommunityKey,
  adminStats,
  adminStopStream,
  adminUpdateCommunity,
  adminUpdateUser,
  adminUsers,
} from "./api";
import type { StreamCredentials } from "@/features/communities/types";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersList: (q?: string) => [...adminKeys.all, "users", q ?? ""] as const,
  communities: () => [...adminKeys.all, "communities"] as const,
  members: (id: string) => [...adminKeys.all, "members", id] as const,
  streamKey: (id: string) => [...adminKeys.all, "stream-key", id] as const,
  live: () => [...adminKeys.all, "live"] as const,
  recordings: () => [...adminKeys.all, "recordings"] as const,
  recordingsList: (communityId?: string) =>
    [...adminKeys.all, "recordings", communityId ?? ""] as const,
};

// ── Stats ──
export const useAdminStats = () => useQuery({ queryKey: adminKeys.stats(), queryFn: adminStats });

// ── Users ──
export const useAdminUsers = (q?: string) =>
  useQuery({ queryKey: adminKeys.usersList(q), queryFn: () => adminUsers(q) });

export const useAdminUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: { system_role?: string; is_active?: boolean } }) =>
      adminUpdateUser(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users() }),
  });
};

export const useAdminResetUserPassword = () =>
  useMutation({
    mutationFn: (vars: { id: string; password: string }) =>
      adminResetUserPassword(vars.id, vars.password),
  });

export const useAdminDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.users() }),
  });
};

// ── Communities ──
export const useAdminCommunities = () =>
  useQuery({ queryKey: adminKeys.communities(), queryFn: adminCommunities });

export const useAdminUpdateCommunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      data: { is_suspended?: boolean; name?: string; description?: string; is_private?: boolean };
    }) => adminUpdateCommunity(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.communities() }),
  });
};

export const useAdminDeleteCommunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDeleteCommunity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.communities() }),
  });
};

// ── Live ──
export const useAdminLive = () =>
  useQuery({ queryKey: adminKeys.live(), queryFn: adminLive, refetchInterval: 10_000 });

export const useAdminStopStream = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminStopStream(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.live() });
      qc.invalidateQueries({ queryKey: adminKeys.communities() });
    },
  });
};

// ── Community members + stream key ──
export const useAdminCommunityMembers = (id: string) =>
  useQuery({ queryKey: adminKeys.members(id), queryFn: () => adminCommunityMembers(id) });

export const useAdminCommunityStreamKey = (id: string) =>
  useQuery({ queryKey: adminKeys.streamKey(id), queryFn: () => adminCommunityStreamKey(id) });

export const useAdminKickMember = (communityId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminKickMember(communityId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.members(communityId) }),
  });
};

export const useAdminRotateCommunityKey = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminRotateCommunityKey(id),
    onSuccess: (creds: StreamCredentials) => qc.setQueryData(adminKeys.streamKey(id), creds),
  });
};

// ── Recordings ──
export const useAdminRecordings = (communityId?: string) =>
  useQuery({
    queryKey: adminKeys.recordingsList(communityId),
    queryFn: () => adminRecordings(communityId),
  });

export const useAdminDeleteRecording = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => adminDeleteRecording(path),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.recordings() }),
  });
};
