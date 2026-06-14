import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";
import { getMatchesForRequest } from "@/lib/blood/data";

/**
 * Server-Sent Events stream for live blood-request status.
 * GET /api/blood/stream?requestId=…
 *
 * Emits a `status` event with the current request status + match list whenever it
 * changes (donor accepted / declined / arrived / donated). The hospital board
 * subscribes via EventSource and updates without a refresh. The same SSE pattern
 * backs the other live surfaces (audit log, emergency access, provider verification).
 *
 * In demo mode the data is seeded, so updates are simulated and labelled as such.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  // Hospital / provider staff (blood:request) may watch the live match board.
  if (!user || !can(user.role, "blood:request")) {
    return new Response("Forbidden", { status: 403 });
  }

  const requestId = new URL(request.url).searchParams.get("requestId");
  if (!requestId) return new Response("requestId required", { status: 400 });

  const encoder = new TextEncoder();
  let lastSerialized = "";
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      send("hello", { ok: true, demo: isDemoMode, ts: Date.now() });

      const tick = async () => {
        if (closed) return;
        try {
          const snapshot = await getMatchesForRequest(requestId);
          const serialized = JSON.stringify(snapshot);
          if (serialized !== lastSerialized) {
            lastSerialized = serialized;
            send("status", { ...snapshot, demo: isDemoMode, ts: Date.now() });
          } else {
            // keep-alive comment so proxies don't drop the connection
            controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
          }
        } catch {
          /* transient — try again next tick */
        }
      };

      await tick();
      const interval = setInterval(tick, 3000);

      // Stop when the client disconnects.
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
