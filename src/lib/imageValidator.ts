// Claude's web_search tool returns web-page URLs, not real image paths — so when
// FactWeaver fills in `imageUrl` it's guessing. Most guesses 404. We gate on
// trusted hosts (Wikimedia Commons) where hotlinking is reliably supported, and
// strip everything else.

const TRUSTED_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

export function isTrustedImage(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return TRUSTED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

// Thematically-keyed fallbacks. Each URL is a real Wikimedia Commons thumbnail
// we know loads in the browser. Chosen by keyword-scoring the transcript +
// fragments against the `themes` list.
const FALLBACKS: Array<{
  url: string;
  credit: string;
  themes: string[];
}> = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Paratroopers_just_before_they_took_off_for_the_initial_assault_of_D-Day.jpg/800px-Paratroopers_just_before_they_took_off_for_the_initial_assault_of_D-Day.jpg",
    credit: "U.S. Army, public domain — NARA via Wikimedia Commons",
    themes: [
      "paratrooper",
      "airborne",
      "jumped",
      "jump",
      "101st",
      "82nd",
      "normandy",
      "d-day",
      "european",
    ],
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Into_the_Jaws_of_Death_23-0455M_edit.jpg/1024px-Into_the_Jaws_of_Death_23-0455M_edit.jpg",
    credit:
      "U.S. Coast Guard — 'Into the Jaws of Death' (Omaha Beach), public domain via Wikimedia Commons",
    themes: [
      "landing",
      "landings",
      "beach",
      "omaha",
      "utah",
      "higgins",
      "lcvp",
      "amphibious",
      "navy",
      "marine",
      "boat",
      "craft",
      "ramp",
    ],
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/WWII_Iwo_Jima_flag_raising.jpg/1024px-WWII_Iwo_Jima_flag_raising.jpg",
    credit: "Joe Rosenthal / AP — 'Raising the Flag on Iwo Jima', public domain",
    themes: ["iwo jima", "pacific", "okinawa", "guadalcanal", "japan", "japanese"],
  },
];

export function pickFallbackImage(context: string): {
  url: string;
  credit: string;
} {
  const lower = context.toLowerCase();
  let best = FALLBACKS[0];
  let bestScore = 0;
  for (const f of FALLBACKS) {
    const score = f.themes.reduce(
      (acc, t) => acc + (lower.includes(t) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  return { url: best.url, credit: best.credit };
}
