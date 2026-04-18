import { YoutubeTranscript } from "youtube-transcript";
import type { RunRequest } from "@/lib/types";
import fixtureEvents from "@/fixtures/sample-norman.json";

export type TranscriptResult = {
  text: string;
  durationSec: number;
  title?: string;
  speaker?: string;
  author?: string; // YouTube channel name, kept for provenance
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

  // Fetch captions and video metadata in parallel. Title often contains the
  // veteran's name ("Norman Duncan - D-Day Paratrooper Interview"), which gives
  // the Narrator a second signal for signoff name extraction beyond the
  // transcript itself.
  const [transcriptRes, meta] = await Promise.allSettled([
    YoutubeTranscript.fetchTranscript(body.youtubeUrl),
    body.title
      ? Promise.resolve({} as { title?: string; author?: string })
      : fetchYouTubeMeta(body.youtubeUrl),
  ]);

  if (transcriptRes.status === "rejected") {
    // YouTube fetch commonly fails (rate-limit, no captions). Fall back.
    return transcriptFromFixture(body);
  }

  const entries = transcriptRes.value;
  const text = entries.map((e) => e.text).join(" ");
  const last = entries.at(-1);
  const durationSec = last ? (last.offset + last.duration) / 1000 : 0;
  const m = meta.status === "fulfilled" ? meta.value : {};
  return {
    text,
    durationSec,
    title: body.title ?? m.title,
    speaker: body.speaker,
    author: m.author,
  };
}

// YouTube oEmbed — no API key needed, returns the canonical video title and
// uploader channel for any public video.
async function fetchYouTubeMeta(
  url: string,
): Promise<{ title?: string; author?: string }> {
  try {
    const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembed, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
    };
    return { title: data.title, author: data.author_name };
  } catch {
    return {};
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
