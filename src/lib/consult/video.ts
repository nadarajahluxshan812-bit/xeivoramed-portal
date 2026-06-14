import { env } from "@/lib/env";

/**
 * Video consultation provider abstraction (STUB).
 *
 * The interface is production-shaped; the default "stub" implementation returns a
 * deterministic room URL so the UI and data flow work end-to-end. To go live, set
 * VIDEO_PROVIDER=daily and DAILY_API_KEY, then implement `createDailyRoom`.
 *
 * Recommended providers for Sri Lanka latency: Daily.co or Agora.
 */
export interface VideoRoom {
  roomUrl: string;
  provider: string;
  expiresAt: Date;
}

export async function createVideoRoom(consultationId: string): Promise<VideoRoom> {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

  if (env.video.provider === "daily" && env.video.dailyApiKey) {
    return createDailyRoom(consultationId, expiresAt);
  }

  // Stub: a stable placeholder room for demos/local dev.
  return {
    roomUrl: `${env.appUrl}/consult/room/${consultationId}`,
    provider: "stub",
    expiresAt,
  };
}

async function createDailyRoom(consultationId: string, expiresAt: Date): Promise<VideoRoom> {
  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.video.dailyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `sehat-${consultationId}`,
      privacy: "private",
      properties: { exp: Math.floor(expiresAt.getTime() / 1000), enable_chat: true },
    }),
  });
  if (!res.ok) throw new Error(`Daily room creation failed: ${res.status}`);
  const data = (await res.json()) as { url: string };
  return { roomUrl: data.url, provider: "daily", expiresAt };
}
