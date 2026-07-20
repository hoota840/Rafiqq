// Free, no-API-key POI data for the outdoor Hajj corridor (Masjid al-Haram
// surroundings, Mina, Muzdalifah, Arafat) via OpenStreetMap's public Overpass
// API — the same open data source as LeafletMapView's map tiles. Verified
// live against overpass-api.de before building this: real hospitals, police
// stations, Tawafa establishment headquarters (the offices that manage
// pilgrim groups by nationality/region — genuinely useful wayfinding
// targets), and pilgrim guidance centres all exist in OSM for this area.
// Does NOT cover indoor positioning inside Masjid al-Haram — confirmed no
// indoor/level tags exist in OSM for it; that remains a real open blocker
// (see data/maps/README.md and CLAUDE.md), not something this can solve.

export type NearbySite = {
  id: string;
  name: string;
  category: "hospital" | "police" | "tawafa" | "guidance" | "other";
  lat: number;
  lng: number;
};

// Covers Masjid al-Haram, Mina, Muzdalifah, and Arafat — same bounding box
// LeafletMapView already centers/zooms the map on.
const BBOX = "21.30,39.75,21.48,40.05";
// Public Overpass instances are occasionally overloaded or briefly down —
// observed live during testing (504 "server too busy" from the primary).
// Try each in order; the first that responds wins.
const OVERPASS_ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const FETCH_TIMEOUT_MS = 20_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Overpass data changes rarely; a day is plenty.

const QUERY = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](${BBOX});
  way["amenity"="hospital"](${BBOX});
  node["amenity"="police"](${BBOX});
  way["amenity"="police"](${BBOX});
  node["name"~"Tawafa",i](${BBOX});
  way["name"~"Tawafa",i](${BBOX});
  node["name"~"Guidance",i](${BBOX});
  way["name"~"Guidance",i](${BBOX});
);
out center 150;
`.trim();

// Real POIs, hand-captured from a live, verified Overpass query against this
// exact area (see CLAUDE.md "Nearby real-world POIs" for how this was
// checked) — used only when every live Overpass endpoint is unreachable AND
// there's no cache yet, so the map never shows nothing just because a free
// public service happens to be down at demo time. Refreshed from a live
// fetch whenever Overpass cooperates; this is a floor, not the primary path.
const STATIC_FALLBACK_SITES: NearbySite[] = [
  { id: "seed-1", name: "Mina Al-Jisr Hospital", category: "hospital", lat: 21.4052, lng: 39.8885 },
  { id: "seed-2", name: "Mina Al-Wadi Hospital", category: "hospital", lat: 21.4132, lng: 39.9017 },
  { id: "seed-3", name: "Arafat General Hospital", category: "hospital", lat: 21.3501, lng: 39.9833 },
  { id: "seed-4", name: "South of Mina Police Station", category: "police", lat: 21.4053, lng: 39.8883 },
  { id: "seed-5", name: "Mina Al-Wadi Police Station", category: "police", lat: 21.4134, lng: 39.8981 },
  { id: "seed-6", name: "Arafat 4 Pilgrim Guidance Centre", category: "guidance", lat: 21.3461, lng: 39.9848 },
  {
    id: "seed-7",
    name: "Tawafa Establishments South Eastern Asia — Headquarter Mina",
    category: "tawafa",
    lat: 21.4201,
    lng: 39.8931,
  },
  { id: "seed-8", name: "Tawafa Establishment Iran — Headquarter Mina", category: "tawafa", lat: 21.4104, lng: 39.893 },
  {
    id: "seed-9",
    name: "Tawafa Establishment Non-Arab African Countries — HQ Mina",
    category: "tawafa",
    lat: 21.4092,
    lng: 39.8965,
  },
  {
    id: "seed-10",
    name: "Tawafa Establishment Arabic Countries — Headquarter Mina",
    category: "tawafa",
    lat: 21.4145,
    lng: 39.8873,
  },
  {
    id: "seed-11",
    name: "Tawafa Establishment Turkey and Muslims of Europe/America — HQ Mina",
    category: "tawafa",
    lat: 21.4173,
    lng: 39.9001,
  },
  {
    id: "seed-12",
    name: "Tawafa Establishments Headquarters Arafat — Arabic Countries",
    category: "tawafa",
    lat: 21.3496,
    lng: 39.9754,
  },
  {
    id: "seed-13",
    name: "Tawafa Establishments Headquarters Arafat — Southern Asia",
    category: "tawafa",
    lat: 21.3349,
    lng: 39.9762,
  },
];

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function categorize(tags: Record<string, string> | undefined, name: string): NearbySite["category"] {
  if (tags?.amenity === "hospital") return "hospital";
  if (tags?.amenity === "police") return "police";
  if (/tawafa/i.test(name)) return "tawafa";
  if (/guidance/i.test(name)) return "guidance";
  return "other";
}

let cache: { data: NearbySite[]; fetchedAt: number } | null = null;

async function fetchFromEndpoint(base: string): Promise<NearbySite[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // GET with the query as a URL param — the format that actually works;
    // a raw POST body against overpass-api.de returned 406 Not Acceptable
    // in live testing regardless of content type.
    const url = `${base}?data=${encodeURIComponent(QUERY)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Overpass request failed: ${res.status}`);
    }
    const data = (await res.json()) as { elements: OverpassElement[] };

    const seen = new Set<string>();
    const sites: NearbySite[] = [];
    for (const el of data.elements) {
      const name = el.tags?.name;
      if (!name || seen.has(name)) continue;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) continue;
      seen.add(name);
      sites.push({ id: `${el.type}-${el.id}`, name, category: categorize(el.tags, name), lat, lng });
    }
    return sites;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromOverpass(): Promise<NearbySite[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchFromEndpoint(endpoint);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Cached, fail-soft: tries each Overpass endpoint in turn; if all of them
 * fail, serves the last-known cache, or the verified static seed list if
 * there's no cache yet. Never throws, never returns nothing.
 */
export async function getNearbySites(): Promise<NearbySite[]> {
  const isFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cache!.data;

  try {
    const data = await fetchFromOverpass();
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.warn("[overpassClient] all Overpass endpoints failed, falling back:", (err as Error).message);
    return cache?.data ?? STATIC_FALLBACK_SITES;
  }
}
