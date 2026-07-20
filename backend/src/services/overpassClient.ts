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
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
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

async function fetchFromOverpass(): Promise<NearbySite[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: QUERY,
      signal: controller.signal,
    });
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

/** Cached, fail-soft: Overpass being slow/down returns the last-known list (or empty), never throws. */
export async function getNearbySites(): Promise<NearbySite[]> {
  const isFresh = cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (isFresh) return cache!.data;

  try {
    const data = await fetchFromOverpass();
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.warn("[overpassClient] fetch failed, falling back to stale/empty cache:", (err as Error).message);
    return cache?.data ?? [];
  }
}
