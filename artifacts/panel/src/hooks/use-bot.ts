import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchApi = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

export function useBotStatus() {
  return useQuery({
    queryKey: ["bot", "status"],
    queryFn: () => fetchApi("/api/bot/status"),
    refetchInterval: 4000,
  });
}

export function useThreadActivity() {
  return useQuery({
    queryKey: ["bot", "thread-activity"],
    queryFn: () => fetchApi("/api/bot/thread-activity"),
    refetchInterval: 15000,
  });
}

export function useBotLogs() {
  return useQuery({
    queryKey: ["bot", "logs"],
    queryFn: () => fetchApi("/api/bot/logs"),
    refetchInterval: 4000,
  });
}

export function useBotSettings() {
  return useQuery({
    queryKey: ["bot", "settings"],
    queryFn: () => fetchApi("/api/bot/settings"),
  });
}

export function useUpdateBotSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: { prefix: string; botName: string; admins: string[] }) =>
      fetchApi("/api/bot/settings", { method: "POST", body: JSON.stringify(settings) }),
    onSuccess: (data) => {
      queryClient.setQueryData(["bot", "settings"], data.settings);
    },
  });
}

export function useReconnectBot() {
  return useMutation({
    mutationFn: () => fetchApi("/api/bot/reconnect", { method: "POST" }),
  });
}

export type ModulesData = {
  nameLock: { active: boolean; name: string | null; threadId: string | null };
  schedulers: Record<string, { active: boolean; message: string | null; intervalMs: number | null }>;
  schedulers2: Record<string, { active: boolean; message: string | null; minMs: number | null; maxMs: number | null; activeWindowMs: number | null }>;
  nicknames: Record<string, { active: boolean; nickname: string | null; intervalMs: number | null; participantCount: number }>;
};

export function useBotModules() {
  return useQuery<ModulesData>({
    queryKey: ["bot", "modules"],
    queryFn: () => fetchApi("/api/bot/modules"),
    refetchInterval: 4000,
  });
}

export function useStopModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, threadID }: { type: "nm_stop" | "hook_stop" | "hook2_stop" | "nicknames_stop"; threadID?: string }) =>
      fetchApi("/api/bot/modules/stop", { method: "POST", body: JSON.stringify({ type, threadID }) }),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["bot", "modules"] }), 6000);
    },
  });
}

export function useStartModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      type: "hook_start" | "hook2_start" | "nm_start" | "nicknames_start";
      threadID: string;
      message?: string;
      intervalMs?: number;
      minIntervalMs?: number;
      maxIntervalMs?: number;
      activeWindowMs?: number;
      name?: string;
      nickname?: string;
    }) => fetchApi("/api/bot/modules/start", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["bot", "modules"] }), 6000);
    },
  });
}

export function useCookies() {
  return useQuery({
    queryKey: ["bot", "cookies"],
    queryFn: () => fetchApi("/api/bot/cookies"),
    staleTime: 30000,
  });
}

export function useUploadCookies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appstate: unknown[]) =>
      fetchApi("/api/bot/cookies", { method: "POST", body: JSON.stringify({ appstate }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot", "cookies"] });
      queryClient.invalidateQueries({ queryKey: ["bot", "status"] });
    },
  });
}

export function useSysStats() {
  return useQuery<{ cpu: number; ramMB: number; totalRamMB: number }>({
    queryKey: ["bot", "sys-stats"],
    queryFn: () => fetchApi("/api/bot/sys-stats"),
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ threadID, message }: { threadID: string; message: string }) =>
      fetchApi("/api/bot/send", { method: "POST", body: JSON.stringify({ threadID, message }) }),
  });
}

export function useBroadcast() {
  return useMutation({
    mutationFn: ({ message }: { message: string }) =>
      fetchApi("/api/bot/broadcast", { method: "POST", body: JSON.stringify({ message }) }),
  });
}
