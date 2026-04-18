// Claude's web_search tool returns page URLs, not image paths, so any
// `imageUrl` it produces is a guess — and in practice those guesses 404 even
// when the hostname is correct (Wikimedia paths use hashed prefixes Claude
// can't predict). Rather than runtime-validate (Wikimedia 429s repeat HEAD
// requests from the same IP), we ignore Claude's imageUrl entirely and always
// assign a verified-real image from a curated library, picked by theme.

// Every URL below was resolved via the Wikipedia REST API
// (https://en.wikipedia.org/api/rest_v1/page/summary/<page>) so the path
// prefixes are real. These images render in browsers without 429 because a
// single render per page is well under the per-IP threshold.
const CURATED: Array<{
  url: string;
  credit: string;
  themes: string[];
}> = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Into_the_Jaws_of_Death_23-0455M_edit.jpg/1024px-Into_the_Jaws_of_Death_23-0455M_edit.jpg",
    credit:
      "Robert F. Sargent, U.S. Coast Guard — 'Into the Jaws of Death', Omaha Beach, June 6 1944 (public domain, NARA)",
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
      "d-day",
      "normandy",
      "european",
    ],
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Raising_the_Flag_on_Iwo_Jima%2C_larger_-_edit1.jpg/1024px-Raising_the_Flag_on_Iwo_Jima%2C_larger_-_edit1.jpg",
    credit:
      "Joe Rosenthal, Associated Press — 'Raising the Flag on Iwo Jima', February 23 1945 (public domain)",
    themes: [
      "iwo jima",
      "pacific",
      "okinawa",
      "guadalcanal",
      "japan",
      "japanese",
      "marine corps",
    ],
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/NormandySupply_edit.jpg/1024px-NormandySupply_edit.jpg",
    credit:
      "U.S. Coast Guard — Operation Overlord supply landings, Normandy June 1944 (public domain, NARA)",
    themes: [
      "overlord",
      "normandy",
      "supply",
      "paratrooper",
      "airborne",
      "101st",
      "82nd",
      "jump",
      "jumped",
      "europe",
      "european",
    ],
  },
];

export function pickFallbackImage(context: string): {
  url: string;
  credit: string;
} {
  const lower = context.toLowerCase();
  let best = CURATED[0];
  let bestScore = -1;
  for (const f of CURATED) {
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
