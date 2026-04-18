import { NextRequest } from "next/server";
import { orchestrate } from "@/lib/orchestrator";
import type { RunRequest, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RunRequest;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      const emit = (e: StreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(e)}\n\n`),
          );
        } catch {
          // Client disconnected while agents were mid-flight; swallow and
          // let the remaining agents finish silently.
          closed = true;
        }
      };
      try {
        await orchestrate(body, emit);
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
