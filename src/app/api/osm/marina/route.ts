import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

interface MarinaDock {
  name: string;
  lat: number;
  lng: number;
  width: number;
  height: number;
  slipCount: number;
  slipLength: number;
  slipWidth: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    if (!lat || !lng) {
      return apiError("Missing lat/lng parameters", 400);
    }

    // Query Overpass API for marina data
    const overpassQuery = `[out:json];
      (
        way["man_made"="pier"](around:400,${lat},${lng});
        way["waterway"="dock"](around:400,${lat},${lng});
        way["leisure"="marina"](around:400,${lat},${lng});
        relation["leisure"="marina"](around:400,${lat},${lng});
      );
      out body;
      >;
      out skel qt;`;

    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: { "User-Agent": "MarinaOS/1.0" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      return apiError("Overpass API error", 502);
    }

    const data = await res.json();
    if (!data.elements || data.elements.length < 3) {
      return apiSuccess({ docks: [], source: "osm", marinaName: null });
    }

    // Filter to pier/dock ways
    const pierWays = data.elements.filter(
      (e: any) => e.type === "way" && (e.tags?.man_made === "pier" || e.tags?.waterway === "dock")
    );

    if (pierWays.length < 2) {
      return apiSuccess({ docks: [], source: "osm", marinaName: null });
    }

    // Build node lookup
    const nodes: Record<number, { lat: number; lon: number }> = {};
    data.elements.forEach((e: any) => {
      if (e.type === "node" && e.lat) {
        nodes[e.id] = { lat: e.lat, lon: e.lon };
      }
    });

    // Convert pier ways to docks
    const dockLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const docks: MarinaDock[] = [];

    pierWays.forEach((way: any, idx: number) => {
      if (!way.nodes || way.nodes.length < 2) return;

      const coords = way.nodes
        .map((nid: number) => nodes[nid])
        .filter((n: any) => n);

      if (coords.length < 2) return;

      let sumLat = 0, sumLon = 0;
      let minLat = Infinity, maxLat = -Infinity;
      let minLon = Infinity, maxLon = -Infinity;
      coords.forEach((c: any) => {
        sumLat += c.lat; sumLon += c.lon;
        if (c.lat < minLat) minLat = c.lat;
        if (c.lat > maxLat) maxLat = c.lat;
        if (c.lon < minLon) minLon = c.lon;
        if (c.lon > maxLon) maxLon = c.lon;
      });
      const centerLat = sumLat / coords.length;
      const centerLon = sumLon / coords.length;

      // Calculate actual east-west (width) and north-south (height) spans in meters
      const spanLng = (maxLon - minLon) * 111320 * Math.cos((centerLat * Math.PI) / 180);
      const spanLat = (maxLat - minLat) * 111320;
      // Ensure minimum dimensions
      const dockWidth = Math.max(spanLng, 4);
      const dockHeight = Math.max(spanLat, 4);

      const slipCount = Math.max(2, Math.round(Math.max(dockWidth, dockHeight) / 4.5));

      docks.push({
        name: way.tags?.name || `Dock ${dockLetters[idx % 26]}`,
        lat: centerLat,
        lng: centerLon,
        width: dockWidth,
        height: dockHeight,
        slipCount,
        slipLength: 40,
        slipWidth: 14,
      });
    });

    // Sort by position (north to south)
    docks.sort((a, b) => b.lat - a.lat);

    // Rename with proper letters
    docks.forEach((d, i) => {
      if (!d.name.startsWith("Dock ")) return;
      d.name = `Dock ${dockLetters[i % 26]}`;
    });

    // Get marina name
    const marina = data.elements.find((e: any) =>
      e.tags?.leisure === "marina" && e.tags?.name
    );

    return apiSuccess({
      docks,
      source: "osm",
      marinaName: marina?.tags?.name || null,
    });
  } catch (error: any) {
    console.error("OSM query error:", error?.message || error);
    return apiError("Failed to query OSM", 500);
  }
}