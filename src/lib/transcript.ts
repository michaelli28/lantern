import { YoutubeTranscript } from "youtube-transcript";
import type { RunRequest } from "@/lib/types";
import fixtureEvents from "@/fixtures/sample-norman.json";

export type TranscriptResult = {
  text: string;
  durationSec: number;
  title?: string;
  speaker?: string;
};

export async function getTranscript(
  body: RunRequest,
): Promise<TranscriptResult> {
  if (body.fixtureId === "norman-duncan" || (!body.youtubeUrl && !body.fixtureId)) {
    return transcriptFromFixture(body);
  }

  if (body.fixtureId) {
    // Unknown fixture id — fall back to sample
    return transcriptFromFixture(body);
  }

  if (!body.youtubeUrl) {
    throw new Error("Provide youtubeUrl or fixtureId");
  }

  try {
    const entries = await YoutubeTranscript.fetchTranscript(body.youtubeUrl);
    const text = entries.map((e) => e.text).join(" ");
    const last = entries.at(-1);
    const durationSec = last ? (last.offset + last.duration) / 1000 : 0;
    return {
      text,
      durationSec,
      title: body.title,
      speaker: body.speaker,
    };
  } catch {
    // YouTube fetch commonly fails (rate-limit, no captions). Fall back.
    return transcriptFromFixture(body);
  }
}

function transcriptFromFixture(body: RunRequest): TranscriptResult {
  const events = fixtureEvents as Array<{
    type: string;
    text?: string;
    durationSec?: number;
    title?: string;
    speaker?: string;
  }>;
  const t = events.find((e) => e.type === "transcript");
  return {
    text: t?.text ?? "",
    durationSec: t?.durationSec ?? 0,
    title: body.title ?? t?.title,
    speaker: body.speaker ?? t?.speaker,
  };
}
