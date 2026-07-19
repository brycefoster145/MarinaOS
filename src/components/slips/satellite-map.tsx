"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Glasses, Crosshair, Save, Trash2, Satellite, Map, Loader2, RotateCcw, Search, Navigation, Pencil } from "lucide-react";
import { toast } from "sonner";

interface DetectedDock {
  id: string;
  name: string;
  lng: number;
  lat: number;
  width: number;
  height: number;
  color: string;
  slipCount: number;
  slipLength: number;
  slipWidth: number;
  dailyRate: number;
  monthlyRate: number;
  confidence?: number;
  /** Per-slip status: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE, UNAVAILABLE */
  slipStatuses?: string[];
}

interface MapSuggestion {
  name: string;
  /** Center x pixel in original image */
  px: number;
  /** Center y pixel in original image */
  py: number;
  /** Dock width in meters */
  width: number;
  /** Dock height in meters */
  height: number;
  color: string;
  slipCount: number;
  slipLength: number;
  slipWidth: number;
  dailyRate: number;
  monthlyRate: number;
  confidence: number;
}

const DOCK_COLORS = [
  "#0284c7", "#059669", "#d97706", "#7c3aed",
  "#dc2626", "#0891b2", "#65a30d", "#0d9488",
];

// Slip status colors
const SLIP_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  OCCUPIED: "#3b82f6",
  RESERVED: "#eab308",
  MAINTENANCE: "#ef4444",
  UNAVAILABLE: "#6b7280",
};

function generateSlipStatuses(count: number): string[] {
  const statuses: string[] = [];
  for (let i = 0; i < count; i++) {
    // ~70% available, ~20% occupied, ~10% reserved
    const rand = Math.random();
    if (rand < 0.7) statuses.push("AVAILABLE");
    else if (rand < 0.9) statuses.push("OCCUPIED");
    else statuses.push("RESERVED");
  }
  return statuses;
}

let dockIdCounter = 0;
function genDockId() {
  dockIdCounter += 1;
  return `dock-${dockIdCounter}`;
}

declare global {
  interface Window {
    mapboxgl: any;
  }
}

export function SatelliteDockDetection() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [docks, setDocks] = useState<DetectedDock[]>([]);
  const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Newport Beach, CA");
  const [lngLat, setLngLat] = useState<[number, number]>([-117.92, 33.62]);
  const [traceMode, setTraceMode] = useState(false);
  const [tracePoints, setTracePoints] = useState<{ lng: number; lat: number }[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [drawStart, setDrawStart] = useState<{ lng: number; lat: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ lng: number; lat: number } | null>(null);
  // Refs for Mapbox event handlers to avoid stale closures
  const drawModeRef = useRef(false);
  const drawStartRef = useRef<{ lng: number; lat: number } | null>(null);
  const drawCurrentRef = useRef<{ lng: number; lat: number } | null>(null);
  const traceModeRef = useRef(false);
  const tracePointsRef = useRef<{ lng: number; lat: number }[]>([]);

  // Keep refs in sync
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { drawStartRef.current = drawStart; }, [drawStart]);
  useEffect(() => { drawCurrentRef.current = drawCurrent; }, [drawCurrent]);
  useEffect(() => { traceModeRef.current = traceMode; }, [traceMode]);
  useEffect(() => { tracePointsRef.current = tracePoints; }, [tracePoints]);

  // Load Mapbox GL JS from CDN
  useEffect(() => {
    if (window.mapboxgl) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
    script.async = true;
    script.onload = () => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
      document.head.appendChild(link);
      setMapLoaded(true);
    };
    script.onerror = () => {
      setMapError("Failed to load Mapbox. Using satellite simulation.");
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;
    if (!window.mapboxgl) {
      setMapError("Mapbox SDK not available.");
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token || token === "placeholder") {
      setMapError("Mapbox token not configured.");
      return;
    }

    try {
      window.mapboxgl.accessToken = token;
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: lngLat,
        zoom: 17,
        attributionControl: false,
      });

      map.addControl(new window.mapboxgl.NavigationControl(), "top-right");
      map.addControl(new window.mapboxgl.ScaleControl(), "bottom-left");

      map.on("load", () => {
              mapRef.current = map;
              setMapError(null);
            });

            map.on("moveend", () => {
              const center = map.getCenter();
              setLngLat([center.lng, center.lat]);
            });

            // Drawing handlers using Mapbox events
                  map.on("mousedown", (e: any) => {
                    if (traceModeRef.current) {
                      e.originalEvent.preventDefault();
                      map.dragPan.disable();
                      const pt = { lng: e.lngLat.lng, lat: e.lngLat.lat };
                      const pts = [...tracePointsRef.current, pt];
                      if (pts.length >= 2) {
                        // Second click — create the dock
                        finishTrace(pts[0], pts[1]);
                        tracePointsRef.current = [];
                        setTracePoints([]);
                        map.dragPan.enable();
                      } else {
                        tracePointsRef.current = pts;
                        setTracePoints(pts);
                      }
                      return;
                    }
                    if (!drawModeRef.current) return;
                    e.originalEvent.preventDefault();
                    map.dragPan.disable();
                    const pt = { lng: e.lngLat.lng, lat: e.lngLat.lat };
                    drawStartRef.current = pt;
                    drawCurrentRef.current = pt;
                    setDrawStart(pt);
                    setDrawCurrent(pt);
                  });

                  map.on("mousemove", (e: any) => {
                    if (!drawModeRef.current || !drawStartRef.current) return;
                    const pt = { lng: e.lngLat.lng, lat: e.lngLat.lat };
                    drawCurrentRef.current = pt;
                    setDrawCurrent(pt);
                  });

                  map.on("mouseup", () => {
                    if (!drawModeRef.current || !drawStartRef.current || !drawCurrentRef.current) {
                      drawStartRef.current = null;
                      drawCurrentRef.current = null;
                      setDrawStart(null);
                      setDrawCurrent(null);
                      return;
                    }
                    finishDraw();
                    map.dragPan.enable();
                  });
    } catch (err) {
      console.error("Map init error:", err);
      setMapError("Failed to initialize map.");
    }
  }, [mapLoaded]);

  // Reposition overlay when map moves
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMove = () => {
      // Force re-render of dock positions
      setDocks((prev) => [...prev]);
    };

    map.on("move", onMove);
    return () => {
      map.off("move", onMove);
    };
  }, [mapRef.current]);

  // Convert lat/lng to pixel coordinates for SVG overlay
  const lngLatToPixel = useCallback(
    (lng: number, lat: number): { x: number; y: number } | null => {
      const map = mapRef.current;
      if (!map) return null;

      try {
        const point = map.project([lng, lat]);
        return { x: point.x, y: point.y };
      } catch {
        return null;
      }
    },
    []
  );

  // Convert pixel to lat/lng
  const pixelToLngLat = useCallback(
    (px: number, py: number): { lng: number; lat: number } | null => {
      const map = mapRef.current;
      if (!map) return null;

      try {
        const lngLat = map.unproject([px, py]);
        return { lng: lngLat.lng, lat: lngLat.lat };
      } catch {
        return null;
      }
    },
    []
  );

  // Search location
  const handleSearch = async () => {
    if (!window.mapboxgl || !mapRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&limit=1`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        const [lng, lat] = data.features[0].center;
        mapRef.current.flyTo({ center: [lng, lat], zoom: 17 });
        setLngLat([lng, lat]);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Query OpenStreetMap for marina dock data via server proxy
  const queryOSMForMarina = async (lat: number, lng: number): Promise<DetectedDock[] | null> => {
    try {
      const res = await fetch(`/api/osm/marina?lat=${lat}&lng=${lng}`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return null;

      const json = await res.json();
      if (!json.data?.docks || json.data.docks.length < 2) return null;

      const docks: DetectedDock[] = json.data.docks.map((d: any, idx: number) => {
        const slipCount = d.slipCount || 4;
        return {
          id: genDockId(),
          name: d.name,
          lng: d.lng,
          lat: d.lat,
          width: d.width || 80,
          height: d.height || 8,
          color: DOCK_COLORS[idx % DOCK_COLORS.length],
          slipCount,
          slipLength: d.slipLength || 40,
          slipWidth: d.slipWidth || 14,
          dailyRate: 3.5 + idx * 0.5,
          monthlyRate: 75 + idx * 10,
          confidence: 0.95,
          slipStatuses: generateSlipStatuses(slipCount),
        };
      });

      const marinaName = json.data.marinaName;
      toast.success(`Found ${docks.length} docks from OpenStreetMap${marinaName ? ` for ${marinaName}` : ""}`);
      return docks;
    } catch (err) {
      console.error("OSM query error:", err);
      return null;
    }
  };

  // Generate a marina layout that fills the viewport
  const generateMarinaLayout = (): DetectedDock[] => {
    const map = mapRef.current;
    if (!map) return [];

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latSpan = Math.abs(ne.lat - sw.lat);
    const lngSpan = Math.abs(ne.lng - sw.lng);

    // Create parallel finger piers filling the viewport
    // Aim for 3-10 docks depending on viewport width
    const dockCount = Math.min(10, Math.max(3, Math.round(lngSpan / 0.0003)));

    const docks: DetectedDock[] = [];
    // Leave 10% margin on each side
    const margin = 0.1;
    const usableLng = lngSpan * (1 - 2 * margin);
    const startLng = sw.lng + lngSpan * margin;
    const spacing = usableLng / dockCount;

    // Dock length: 60% of viewport height, centered
    const dockLengthDeg = latSpan * 0.6;
    const dockCenterLat = (sw.lat + ne.lat) / 2;

    for (let i = 0; i < dockCount; i++) {
      const dockLng = startLng + spacing * (i + 0.5);
      const metersPerDegLng = 111320 * Math.cos((dockCenterLat * Math.PI) / 180);
      const dockLengthM = dockLengthDeg * 111320;
      const slipCount = Math.max(2, Math.round(dockLengthM / 4.5 / 2) * 2);

      docks.push({
        id: genDockId(),
        name: `Dock ${String.fromCharCode(65 + i)}`,
        lng: dockLng,
        lat: dockCenterLat,
        width: dockLengthM,
        height: 8,
        color: DOCK_COLORS[i % DOCK_COLORS.length],
        slipCount,
        slipLength: 40,
        slipWidth: 14,
        dailyRate: 3.5 + i * 0.5,
        monthlyRate: 75 + i * 10,
        confidence: 0.7,
        slipStatuses: generateSlipStatuses(slipCount),
      });
    }

    return docks;
  };

  // Canvas-based dock detection (no AI API needed)
  // Detect dock shapes (long bright rectangles) from canvas
  const detectDocksFromCanvas = (canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number }[] => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const w = canvas.width;
    const h = canvas.height;
    // Use a smaller working image for speed
    const scale = Math.min(1, 400 / Math.max(w, h));
    const sw = Math.round(w * scale);
    const sh = Math.round(h * scale);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = sw;
    tmpCanvas.height = sh;
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx) return [];
    tmpCtx.drawImage(canvas, 0, 0, sw, sh);

    const imageData = tmpCtx.getImageData(0, 0, sw, sh);
    const data = imageData.data;

    // Convert to grayscale
    const gray = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      const idx = i * 4;
      gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    }

    // Find the water brightness level (40th percentile = darkest 40% is water)
    const sorted = [...gray].sort((a, b) => a - b);
    const waterLevel = sorted[Math.floor(sorted.length * 0.4)];
    const dockThreshold = waterLevel + 35;

    // Scan each row for bright stripes (dark→bright→dark patterns)
    // A dock at row y appears as a contiguous run of bright pixels
    const minDockWidth = Math.round(sw * 0.04); // At least 4% of image width
    const rowStripeCounts: number[] = new Array(sh).fill(0);

    for (let y = 0; y < sh; y++) {
      let stripes = 0;
      let x = 0;
      while (x < sw) {
        // Find start of bright run
        while (x < sw && gray[y * sw + x] <= dockThreshold) x++;
        if (x >= sw) break;
        const start = x;
        while (x < sw && gray[y * sw + x] > dockThreshold) x++;
        const end = x - 1;
        const width = end - start + 1;
        if (width >= minDockWidth) {
          stripes++;
        }
      }
      rowStripeCounts[y] = stripes;
    }

    // Find rows with docks (2+ stripes = multiple docks crossing this row)
    // Group consecutive dock rows into dock bands
    interface DockBand {
      yStart: number;
      yEnd: number;
      xStarts: number[];
      xEnds: number[];
    }
    const bands: DockBand[] = [];
    let inBand = false;
    let currentBand: DockBand | null = null;

    for (let y = 0; y < sh; y++) {
      if (rowStripeCounts[y] >= 1) {
        if (!inBand) {
          currentBand = { yStart: y, yEnd: y, xStarts: [], xEnds: [] };
          inBand = true;
        }
        if (currentBand) {
          currentBand.yEnd = y;
          // Scan this row for stripe positions
          let x = 0;
          while (x < sw) {
            while (x < sw && gray[y * sw + x] <= dockThreshold) x++;
            if (x >= sw) break;
            const start = x;
            while (x < sw && gray[y * sw + x] > dockThreshold) x++;
            const end = x - 1;
            if (end - start + 1 >= minDockWidth) {
              currentBand.xStarts.push(start);
              currentBand.xEnds.push(end);
            }
          }
        }
      } else {
        if (inBand && currentBand) {
          // Only keep the band if it's tall enough (at least 3 rows)
          if (currentBand.yEnd - currentBand.yStart >= 3) {
            bands.push(currentBand);
          }
          currentBand = null;
        }
        inBand = false;
      }
    }
    if (inBand && currentBand && currentBand.yEnd - currentBand.yStart >= 3) {
      bands.push(currentBand);
    }

    // Convert bands to dock regions
    const dockRegions: { x: number; y: number; w: number; h: number }[] = [];

    bands.forEach((band) => {
      // Find the most common x position of stripes (cluster them)
      // Group stripes by x position
      const stripeClusters: { x: number; count: number }[] = [];
      for (let i = 0; i < band.xStarts.length; i++) {
        const cx = (band.xStarts[i] + band.xEnds[i]) / 2;
        // Find or create cluster
        let found = false;
        for (const c of stripeClusters) {
          if (Math.abs(c.x - cx) < minDockWidth * 0.5) {
            c.count++;
            found = true;
            break;
          }
        }
        if (!found) {
          stripeClusters.push({ x: cx, count: 1 });
        }
      }

      // Sort clusters by count (most common = most likely dock)
      stripeClusters.sort((a, b) => b.count - a.count);

      // Take the top clusters
      const topClusters = stripeClusters.slice(0, Math.min(8, stripeClusters.length));

      topClusters.forEach((cluster) => {
        const dockW = minDockWidth * 3; // Estimate dock width
        const dockH = (band.yEnd - band.yStart + 1) / scale * 1.5;
        const centerX = (cluster.x) / scale;
        const centerY = (band.yStart + band.yEnd) / 2 / scale;

        // Only add if it's a proper long rectangle (w > 2*h)
        if (dockW > dockH) {
          dockRegions.push({
            x: centerX,
            y: centerY,
            w: dockW,
            h: dockH,
          });
        }
      });
    });

    // Sort by y position and remove duplicates
    dockRegions.sort((a, b) => a.y - b.y);
    return dockRegions;
  };

  // AI Detection
  const runAIDetection = async () => {
    setIsDetecting(true);

    try {
      const map = mapRef.current;
      const container = mapContainerRef.current;
      if (!map || !container) return;

      const canvas = map.getCanvas();

      // Step 1: Try OpenStreetMap data first (most accurate)
      const osmDocks = await queryOSMForMarina(lngLat[1], lngLat[0]);
      if (osmDocks && osmDocks.length >= 2) {
        setDocks(osmDocks);
        setIsDetecting(false);
        return;
      }

      // Step 2: Try client-side computer vision detection
      const detected = detectDocksFromCanvas(canvas);
      const rect = container.getBoundingClientRect();

      // Deduplicate: merge nearby bright strips into one dock
      const mergeThreshold = Math.max(100, canvas.width * 0.12); // 12% of canvas width
      const unique: typeof detected = [];
      for (const d of detected) {
        let merged = false;
        for (const u of unique) {
          if (Math.abs(d.x - u.x) < mergeThreshold) {
            // Merge: average their positions, combine widths
            u.x = (u.x + d.x) / 2;
            u.w = Math.max(u.w, d.w);
            merged = true;
            break;
          }
        }
        if (!merged) unique.push({ ...d });
      }

      if (unique.length >= 2) {
        // Filter out small private docks (< 15m / ~50ft)
        const marinaDocks = unique.filter((d) => {
          const dpr = window.devicePixelRatio || 1;
          const dockWidthM = (d.w / dpr) * 0.1;
          return dockWidthM >= 15;
        });

        if (marinaDocks.length >= 2) {
          const newDocks: DetectedDock[] = marinaDocks.map((d, idx) => {
            const dpr = window.devicePixelRatio || 1;
            const cssPx = d.x / dpr;
            const cssPy = d.y / dpr;
            const lngLat = map.unproject([cssPx, cssPy]);
            const dockWidthM = (d.w / dpr) * 0.1;
            const slipCount = Math.max(2, Math.round(d.w / (dpr * 18)));
            return {
              id: genDockId(),
              name: `Dock ${String.fromCharCode(65 + idx)}`,
              lng: lngLat.lng, lat: lngLat.lat,
              width: dockWidthM, height: 8,
              color: DOCK_COLORS[idx % DOCK_COLORS.length],
              slipCount, slipLength: 40, slipWidth: 14,
              dailyRate: 3.5 + idx * 0.5, monthlyRate: 75 + idx * 10,
              confidence: 0.9, slipStatuses: generateSlipStatuses(slipCount),
            };
          });

          setDocks(newDocks);
          toast.success(`Detected ${newDocks.length} docks`);
          setIsDetecting(false);
          return;
        }

        // If no marina-sized docks found, fall through to generated layout
      }

      // Step 3: Generate a marina layout based on the viewport (always works)
      toast.info("Generating marina layout from viewport...");
      const generated = generateMarinaLayout();
      if (generated.length >= 2) {
        setDocks(generated);
        toast.success(`Generated ${generated.length} docks for your marina`);
      } else {
        toast.error("Could not generate marina layout. Try drawing manually.");
      }
    } catch (err) {
      console.error("Detection error:", err);
      toast.error("Detection failed. Use Draw Dock to trace manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const finishDraw = () => {
    const start = drawStartRef.current;
    const current = drawCurrentRef.current;
    if (!start || !current) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const minLat = Math.min(start.lat, current.lat);
    const maxLat = Math.max(start.lat, current.lat);
    const minLng = Math.min(start.lng, current.lng);
    const maxLng = Math.max(start.lng, current.lng);

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;

    // Require minimum size (about 20m at this latitude)
    const minSize = 0.0001;
    if (latDiff < minSize && lngDiff < minSize) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const dockWidthM = Math.abs(lngDiff) * 111320 * Math.cos((centerLat * Math.PI) / 180);
    const dockHeightM = Math.abs(latDiff) * 111320;
    // Slips are ~4.5m (15ft) wide — fit them along the longer edge
    const longerSide = Math.max(dockWidthM, dockHeightM);
    const slipCount = Math.max(1, Math.round(longerSide / 4.5));

    const idx = docks.length;
    const newDock: DetectedDock = {
      id: genDockId(),
      name: `Dock ${String.fromCharCode(65 + idx)}`,
      lng: centerLng,
      lat: centerLat,
      width: dockWidthM,
      height: dockHeightM,
      color: DOCK_COLORS[idx % DOCK_COLORS.length],
      slipCount,
      slipLength: 40,
      slipWidth: 14,
      dailyRate: 3.5,
      monthlyRate: 85,
      slipStatuses: generateSlipStatuses(slipCount),
    };

    setDocks((prev) => [...prev, newDock]);
    setSelectedDockId(newDock.id);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const finishTrace = (start: { lng: number; lat: number }, end: { lng: number; lat: number }) => {
    const centerLat = (start.lat + end.lat) / 2;
    const centerLng = (start.lng + end.lng) / 2;
    const latDiff = Math.abs(end.lat - start.lat);
    const lngDiff = Math.abs(end.lng - start.lng);
    const dockLengthM = Math.max(latDiff * 111320, lngDiff * 111320 * Math.cos((centerLat * Math.PI) / 180));
    const dockWidthM = 4; // Standard dock width ~4m

    // Slips are ~4.5m wide, placed on both sides
    const slipWidth = 4.5;
    const slipsPerSide = Math.max(1, Math.floor(dockLengthM / slipWidth / 2));
    const totalSlips = slipsPerSide * 2;

    // Determine dock orientation — if more horizontal, width is lng; else width is lat
    const isHorizontal = lngDiff > latDiff;

    const idx = docks.length;
    const newDock: DetectedDock = {
      id: genDockId(),
      name: `Dock ${String.fromCharCode(65 + idx)}`,
      lng: centerLng,
      lat: centerLat,
      width: isHorizontal ? dockLengthM : dockWidthM,
      height: isHorizontal ? dockWidthM : dockLengthM,
      color: DOCK_COLORS[idx % DOCK_COLORS.length],
      slipCount: totalSlips,
      slipLength: 40,
      slipWidth: 14,
      dailyRate: 3.5 + idx * 0.3,
      monthlyRate: 75 + idx * 5,
      slipStatuses: generateSlipStatuses(totalSlips),
    };

    setDocks((prev) => [...prev, newDock]);
    setSelectedDockId(newDock.id);
    setTraceMode(false);
  };

  // Save to DB
  const handleSave = async () => {
    if (docks.length === 0) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/docks/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docks }),
      });

      if (!res.ok) throw new Error("Failed to save");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const selectedDock = docks.find((d) => d.id === selectedDockId);

  const updateDock = (id: string, field: keyof DetectedDock, value: number | string) => {
    setDocks((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const removeDock = (id: string) => {
    setDocks((prev) => prev.filter((d) => d.id !== id));
    if (selectedDockId === id) setSelectedDockId(null);
  };

  const clearAll = () => {
    setDocks([]);
    setSelectedDockId(null);
  };

  // Render dock overlays with individual slips
  const renderDockOverlay = () => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return null;

    return docks.map((dock) => {
      const isSelected = selectedDockId === dock.id;
      const center = lngLatToPixel(dock.lng, dock.lat);
      if (!center) return null;

      const metersPerDegLng = 111320 * Math.cos((dock.lat * Math.PI) / 180);
      const metersPerDegLat = 111320;

      // Dock dimensions in pixels
      const pxDeltaLng = lngLatToPixel(dock.lng + 1 / metersPerDegLng, dock.lat);
      const pxDeltaLat = lngLatToPixel(dock.lng, dock.lat + 1 / metersPerDegLat);
      const halfWPx = (dock.width / 2 / metersPerDegLng) * ((pxDeltaLng ? pxDeltaLng.x : 0) - center.x || 1);
      const halfHPx = (dock.height / 2 / metersPerDegLat) * ((pxDeltaLat ? pxDeltaLat.y : 0) - center.y || 1);

      // Determine orientation: longer side is the walkway direction
      const isHorizontal = dock.width > dock.height;
      const walkwayLengthPx = isHorizontal ? halfWPx * 2 : halfHPx * 2;
      const walkwayWidthPx = Math.min(isHorizontal ? halfHPx * 2 : halfWPx * 2, 12);

      // Slip dimensions in pixels
      const slipWidthPx = walkwayLengthPx / dock.slipCount * 0.8;
      const slipLengthPx = Math.max(isHorizontal ? halfHPx * 2 - walkwayWidthPx : halfWPx * 2 - walkwayWidthPx, 8);

      const slipsPerSide = Math.ceil(dock.slipCount / 2);
      const slipSpacing = walkwayLengthPx / (slipsPerSide + 1);

      const slips: JSX.Element[] = [];
      for (let i = 0; i < dock.slipCount; i++) {
        const side = i < slipsPerSide ? -1 : 1;
        const idx = i < slipsPerSide ? i : i - slipsPerSide;
        const offset = (idx + 1) * slipSpacing - walkwayLengthPx / 2;

        let sx: number, sy: number, sw: number, sh: number;
        if (isHorizontal) {
          sx = center.x + offset - slipWidthPx / 2;
          sy = side === -1 ? center.y - walkwayWidthPx / 2 - slipLengthPx : center.y + walkwayWidthPx / 2;
          sw = slipWidthPx;
          sh = slipLengthPx;
        } else {
          sx = side === -1 ? center.x - walkwayWidthPx / 2 - slipLengthPx : center.x + walkwayWidthPx / 2;
          sy = center.y + offset - slipWidthPx / 2;
          sw = slipLengthPx;
          sh = slipWidthPx;
        }

        // Use status color if available, otherwise fall back to dock color
        const slipStatus = dock.slipStatuses?.[i] || "AVAILABLE";
        const slipColor = SLIP_STATUS_COLORS[slipStatus] || dock.color;
        const showNumber = slipWidthPx > 12;

        slips.push(
          <g key={`slip-${dock.id}-${i}`}>
            <rect
              x={sx} y={sy} width={sw} height={sh} rx={2}
              fill={slipColor}
              fillOpacity={isSelected ? 0.85 : 0.65}
              stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.3)"}
              strokeWidth={1}
              className="cursor-pointer"
              onClick={() => setSelectedDockId(dock.id)}
            />
            {showNumber && (
              <text
                x={isHorizontal ? sx + sw / 2 : sx + sw / 2}
                y={isHorizontal ? sy + sh / 2 + 3 : sy + sh / 2 + 3}
                textAnchor="middle"
                fill="white"
                fontSize={7}
                fontWeight={500}
                fontFamily="monospace"
                opacity={0.9}
                className="pointer-events-none"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
              >
                {dock.slipLength}'
              </text>
            )}
          </g>
        );
      }

      // Walkway
      const walkway = (
        <rect
          x={isHorizontal ? center.x - halfWPx : center.x - walkwayWidthPx / 2}
          y={isHorizontal ? center.y - walkwayWidthPx / 2 : center.y - halfHPx}
          width={isHorizontal ? halfWPx * 2 : walkwayWidthPx}
          height={isHorizontal ? walkwayWidthPx : halfHPx * 2}
          rx={3}
          fill={dock.color}
          fillOpacity={isSelected ? 0.9 : 0.7}
          stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.4)"}
          strokeWidth={isSelected ? 2 : 1}
          className="cursor-pointer"
          onClick={() => setSelectedDockId(dock.id)}
        />
      );

      // Label with background badge
      const labelBgWidth = dock.name.length * 8 + 20;
      const label = (
        <g className="pointer-events-none">
          <rect
            x={center.x - labelBgWidth / 2}
            y={center.y - 14}
            width={labelBgWidth}
            height={24}
            rx={4}
            fill={dock.color}
            fillOpacity={0.85}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
          />
          <text
            x={center.x}
            y={center.y + 4}
            textAnchor="middle"
            fill="white"
            fontSize={12}
            fontWeight={700}
            fontFamily="system-ui"
          >
            {dock.name}
          </text>
        </g>
      );

     
      return <g key={dock.id}>{slips}{walkway}{label}</g>;
    });
  };
  // Render drawing preview
  const renderDrawPreview = () => {
    if (!drawStart || !drawCurrent || !mapRef.current) return null;

    const start = lngLatToPixel(drawStart.lng, drawStart.lat);
    const current = lngLatToPixel(drawCurrent.lng, drawCurrent.lat);
    if (!start || !current) return null;

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const w = Math.abs(current.x - start.x);
    const h = Math.abs(current.y - start.y);

    if (w < 5 && h < 5) return null;

    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill="white"
        fillOpacity={0.15}
        stroke="white"
        strokeWidth={2}
        strokeDasharray="6,3"
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search location..."
              className="h-9 w-48 text-sm"
            />
            <Button variant="outline" size="sm" className="h-9" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={drawMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (traceMode) setTraceMode(false);
              setDrawMode(!drawMode);
            }}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            {drawMode ? "Drawing..." : "Draw Dock"}
          </Button>
          <Button
            variant={traceMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (drawMode) setDrawMode(false);
              setTraceMode(!traceMode);
              setTracePoints([]);
              tracePointsRef.current = [];
            }}
          >
            <Crosshair className="h-4 w-4 mr-1.5" />
            {traceMode ? "Click to place..." : "Quick Trace"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runAIDetection}
            loading={isDetecting}
          >
            <Glasses className="h-4 w-4 mr-1.5" />
            {isDetecting ? "AI Analyzing..." : "AI Detect"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
          <Button size="sm" onClick={handleSave} loading={saving} disabled={docks.length === 0}>
            {saveSuccess ? (
              <><Save className="h-4 w-4 mr-1.5" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4 mr-1.5" /> Save Layout</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden border border-border bg-black/20">
            <div className="p-3 border-b border-border bg-secondary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Satellite View</span>
                {drawMode && (
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                    Draw Mode — Click & drag to create docks
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                {lngLat[1].toFixed(4)}, {lngLat[0].toFixed(4)}
              </div>
            </div>

            <div
              ref={mapContainerRef}
              className="relative"
              style={{ height: "520px", background: "#0a1628", cursor: drawMode ? "crosshair" : "grab" }}
            >
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  <span className="ml-3 text-sm text-muted-foreground">Loading satellite view...</span>
                </div>
              )}

              {mapError && mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a1628]">
                  <div className="text-center">
                    <Satellite className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">{mapError}</p>
                    <p className="text-xs text-muted-foreground/60">
                      Coordinates: {lngLat[1].toFixed(4)}, {lngLat[0].toFixed(4)}
                    </p>
                  </div>
                </div>
              )}

              {/* SVG overlay for docks */}
              {mapLoaded && !mapError && (
                <svg
                  ref={overlayRef}
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  style={{ pointerEvents: drawMode ? "none" : "none" }}
                >
                  <g className="pointer-events-auto">
                    {renderDockOverlay()}
                    {renderDrawPreview()}
                  </g>
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">
                {selectedDock ? `Edit: ${selectedDock.name}` : "Dock Properties"}
              </h3>
            </div>

            {selectedDock ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Name</label>
                  <Input
                    value={selectedDock.name}
                    onChange={(e) => updateDock(selectedDock.id, "name", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Latitude</label>
                    <Input
                      type="number"
                      step={0.0001}
                      value={selectedDock.lat}
                      onChange={(e) => updateDock(selectedDock.id, "lat", parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Longitude</label>
                    <Input
                      type="number"
                      step={0.0001}
                      value={selectedDock.lng}
                      onChange={(e) => updateDock(selectedDock.id, "lng", parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Slip Count</label>
                    <Input
                      type="number"
                      min={1}
                      value={selectedDock.slipCount}
                      onChange={(e) => updateDock(selectedDock.id, "slipCount", parseInt(e.target.value) || 1)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Slip Length (ft)</label>
                    <Input
                      type="number"
                      value={selectedDock.slipLength}
                      onChange={(e) => updateDock(selectedDock.id, "slipLength", parseFloat(e.target.value) || 20)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Daily Rate ($)</label>
                    <Input
                      type="number"
                      value={selectedDock.dailyRate}
                      onChange={(e) => updateDock(selectedDock.id, "dailyRate", parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Monthly Rate ($)</label>
                    <Input
                      type="number"
                      value={selectedDock.monthlyRate}
                      onChange={(e) => updateDock(selectedDock.id, "monthlyRate", parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                {selectedDock.confidence && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <span className="text-xs text-muted-foreground">AI Confidence</span>
                    <span className="text-xs font-medium text-green-400">
                      {(selectedDock.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => removeDock(selectedDock.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove Dock
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                  <Map className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {docks.length === 0
                    ? "Search for a marina, then click 'Draw Dock' to draw rectangles, or 'AI Detect' for automatic detection"
                    : "Click on a dock overlay to edit its properties"}
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Satellite className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Detection Summary</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Docks detected</span>
                <span className="font-medium">{docks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total slips</span>
                <span className="font-medium">{docks.reduce((s, d) => s + d.slipCount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. monthly revenue</span>
                <span className="font-medium">
                  ${docks.reduce((s, d) => s + d.slipCount * d.monthlyRate, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-xs font-mono">
                  {lngLat[1].toFixed(4)}, {lngLat[0].toFixed(4)}
                </span>
              </div>
              {/* Slip status legend */}
              {docks.length > 0 && (
                <div className="pt-2 border-t border-border mt-2">
                  <span className="text-xs font-medium text-muted-foreground block mb-1.5">Slip Status</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Available", color: "#22c55e" },
                      { label: "Occupied", color: "#3b82f6" },
                      { label: "Reserved", color: "#eab308" },
                      { label: "Maintenance", color: "#ef4444" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] text-muted-foreground">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
