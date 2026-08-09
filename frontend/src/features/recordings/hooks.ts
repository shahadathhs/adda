import { useQuery } from "@tanstack/react-query";
import { recordings as fetchRecordings } from "./api";

export const recordingsKeys = {
  all: ["recordings"] as const,
  byCommunity: (id: string) => [...recordingsKeys.all, "community", id] as const,
};

export const useRecordings = (communityId: string) =>
  useQuery({
    queryKey: recordingsKeys.byCommunity(communityId),
    queryFn: () => fetchRecordings(communityId),
  });
