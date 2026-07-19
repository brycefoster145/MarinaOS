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

  // Canvas-based dock detection (no AI API needed)
  const detectDocksFromCanvas = (canvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number }[] => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Convert to grayscale and find bright pixels (dock surfaces)
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      // Luminosity formula
      gray[i] = Math.round(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
    }

    // Calculate average brightness to determine adaptive threshold
    let sum = 0;
    for (let i = 0; i < gray.length; i++) sum += gray[i];
    const avg = sum / gray.length;
    // Docks are bright structures - threshold at avg + 20 (or 140, whichever is higher)
    const threshold = Math.max(avg + 25, 140);

    // Binary image: 1 = bright (potential dock), 0 = dark (water)
    const binary = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      binary[i] = gray[i] > threshold ? 1 : 0;
    }

    // Find horizontal bright line segments (docks are horizontal structures)
    // Scan each row for runs of bright pixels
    const minDockLength = Math.round(w * 0.06); // At least 6% of image width
    const maxGap = Math.round(w * 0.01); // Max gap between bright segments to merge

    // Collect horizontal segments
    const segments: { row: number; colStart: number; colEnd: number }[] = [];

    for (let row = 0; row < h; row++) {
      let col = 0;
      while (col < w) {
        // Skip dark pixels
        while (col < w && binary[row * w + col] === 0) col++;
        if (col >= w) break;

        // Found start of bright run
        const start = col;
        while (col < w && binary[row * w + col] === 1) col++;
        const end = col - 1;
        const length = end - start + 1;

        if (length >= minDockLength) {
          segments.push({ row, colStart: start, colEnd: end });
        }
      }
    }

    // Group segments into dock rectangles
    // Two segments are in the same dock if they overlap horizontally and are close vertically
    const dockRegions: { x: number; y: number; w: number; h: number }[] = [];
    const used = new Set<number>();

    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;

      let minRow = segments[i].row;
      let maxRow = segments[i].row;
      let minCol = segments[i].colStart;
      let maxCol = segments[i].colEnd;
      used.add(i);

      // Look for adjacent rows that overlap
      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < segments.length; j++) {
          if (used.has(j)) continue;
          const s = segments[j];
          // Check if close vertically (within 8 rows) and overlapping horizontally
          if (s.row >= minRow - 8 && s.row <= maxRow + 8) {
            const overlap = Math.min(maxCol, s.colEnd) - Math.max(minCol, s.colStart);
            if (overlap > 0) {
              minRow = Math.min(minRow, s.row);
              maxRow = Math.max(maxRow, s.row);
              minCol = Math.min(minCol, s.colStart);
              maxCol = Math.max(maxCol, s.colEnd);
              used.add(j);
              changed = true;
            }
          }
        }
      }

      const dockW = maxCol - minCol + 1;
      const dockH = maxRow - minRow + 1;
      // Filter out very small or very square regions (docks are long and thin)
      if (dockW > minDockLength && dockH < dockW * 0.3 && dockH > 3) {
        dockRegions.push({
          x: minCol + (maxCol - minCol) / 2,
          y: minRow + (maxRow - minRow) / 2,
          w: dockW,
          h: dockH,
        });
      }
    }

    // Also scan for vertical docks (perpendicular to main docks)
    // Find vertical bright line segments
    const verticalSegments: { col: number; rowStart: number; rowEnd: number }[] = [];
    for (let col = 0; col < w; col++) {
      let row = 0;
      while (row < h) {
        while (row < h && binary[row * w + col] === 0) row++;
        if (row >= h) break;
        const start = row;
        while (row < h && binary[row * w + col] === 1) row++;
        const end = row - 1;
        const length = end - start + 1;
        // Vertical docks: shorter segments, at least 20px
        if (length >= 20) {
          verticalSegments.push({ col, rowStart: start, rowEnd: end });
        }
      }
    }

    // Group vertical segments
    const vUsed = new Set<number>();
    for (let i = 0; i < verticalSegments.length; i++) {
      if (vUsed.has(i)) continue;

      let minCol = verticalSegments[i].col;
      let maxCol = verticalSegments[i].col;
      let minRow = verticalSegments[i].rowStart;
      let maxRow = verticalSegments[i].rowEnd;
      vUsed.add(i);

      let changed = true;
      while (changed) {
        changed = false;
        for (let j = 0; j < verticalSegments.length; j++) {
          if (vUsed.has(j)) continue;
          const s = verticalSegments[j];
          if (s.col >= minCol - 8 && s.col <= maxCol + 8) {
            const overlap = Math.min(maxRow, s.rowEnd) - Math.max(minRow, s.rowStart);
            if (overlap > 0) {
              minCol = Math.min(minCol, s.col);
              maxCol = Math.max(maxCol, s.col);
              minRow = Math.min(minRow, s.rowStart);
              maxRow = Math.max(maxRow, s.rowEnd);
              vUsed.add(j);
              changed = true;
            }
          }
        }
      }

      const dockW = maxCol - minCol + 1;
      const dockH = maxRow - minRow + 1;
      if (dockH > 40 && dockW < dockH * 0.3) {
        dockRegions.push({
          x: minCol + (maxCol - minCol) / 2,
          y: minRow + (maxRow - minRow) / 2,
          w: dockW,
          h: dockH,
        });
      }
    }

    // Sort by y position (top to bottom)
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
      const rect = container.getBoundingClientRect();

      // Step 1: Try client-side computer vision detection first
      const detected = detectDocksFromCanvas(canvas);

      if (detected.length >= 2) {
        const newDocks: DetectedDock[] = detected.map((d, idx) => {
          // Convert canvas pixel coords to CSS pixel coords for map.unproject
          const dpr = window.devicePixelRatio || 1;
          const cssPx = d.x / dpr;
          const cssPy = d.y / dpr;
          const lngLat = map.unproject([cssPx, cssPy]);

          const dockWidthM = (d.w / dpr) * 0.1; // Rough meter estimate
          const slipCount = Math.max(2, Math.round(d.w / (dpr * 18)));

          return {
            id: genDockId(),
            name: `Dock ${String.fromCharCode(65 + idx)}`,
            lng: lngLat.lng,
            lat: lngLat.lat,
            width: dockWidthM,
            height: 8,
            color: DOCK_COLORS[idx % DOCK_COLORS.length],
            slipCount,
            slipLength: 40,
            slipWidth: 14,
            dailyRate: 3.5 + idx * 0.5,
            monthlyRate: 75 + idx * 10,
            confidence: 0.9,
          };
        });

        setDocks(newDocks);
        toast.success(`Detected ${newDocks.length} docks from satellite imagery`);
        setIsDetecting(false);
        return;
      }

      // Step 2: Fall back to AI API if computer vision didn't find enough
      const origWidth = canvas.width;
      const origHeight = canvas.height;

      let imageUrl = canvas.toDataURL("image/jpeg", 0.7);
      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = imageUrl;
      });

      let resizeRatio = 1;
      let finalWidth = img.width;
      let finalHeight = img.height;
      if (img.width > 800) {
        const scale = 800 / img.width;
        finalWidth = 800;
        finalHeight = img.height * scale;
        resizeRatio = scale;
        const resizedCanvas = document.createElement("canvas");
        resizedCanvas.width = finalWidth;
        resizedCanvas.height = finalHeight;
        const ctx = resizedCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, resizedCanvas.width, resizedCanvas.height);
          imageUrl = resizedCanvas.toDataURL("image/jpeg", 0.7);
        }
      }

      const res = await fetch("/api/ai/detect-docks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          latitude: lngLat[1],
          longitude: lngLat[0],
          zoom: map.getZoom(),
          mapWidth: rect.width,
          mapHeight: rect.height,
          imageWidth: finalWidth,
          imageHeight: finalHeight,
        }),
      });

      const json = await res.json();
      if (json.data?.suggestions && json.data.suggestions.length > 0) {
        const dpr = window.devicePixelRatio || 1;
        const newDocks = json.data.suggestions.map((s: MapSuggestion) => {
          // Convert pixel coordinates back to full-canvas space
          const canvasPx = s.px / resizeRatio;
          const canvasPy = s.py / resizeRatio;
          // Convert to CSS pixel space for map.unproject
          const cssPx = canvasPx / dpr;
          const cssPy = canvasPy / dpr;

          // Convert pixel coords to lat/lng using Mapbox unproject
          const lngLat = map.unproject([cssPx, cssPy]);

          return {
            id: genDockId(),
            name: s.name,
            lng: lngLat.lng,
            lat: lngLat.lat,
            width: s.width || 80,
            height: s.height || 8,
            color: s.color || DOCK_COLORS[0],
            slipCount: s.slipCount || 4,
            slipLength: s.slipLength || 40,
            slipWidth: s.slipWidth || 14,
            dailyRate: s.dailyRate || 3.5,
            monthlyRate: s.monthlyRate || 85,
            confidence: s.confidence || 0.8,
          };
        });
        setDocks((prev) => {
          const existing = [...prev];
          newDocks.forEach((nd: DetectedDock) => {
            if (!existing.find((d) => d.name === nd.name)) {
              existing.push(nd);
            }
          });
          return existing;
        });
        toast.success(`Detected ${newDocks.length} docks via ${json.data.source || "AI"}`);
      } else {
        toast.error("No docks detected. Try drawing them manually.");
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

        slips.push(
          <rect
            key={`slip-${dock.id}-${i}`}
            x={sx} y={sy} width={sw} height={sh} rx={2}
            fill={dock.color}
            fillOpacity={isSelected ? 0.7 : 0.45}
            stroke={dock.color} strokeWidth={1}
            className="cursor-pointer"
            onClick={() => setSelectedDockId(dock.id)}
          />
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
          fillOpacity={isSelected ? 0.8 : 0.6}
          stroke={isSelected ? "#ffffff" : dock.color}
          strokeWidth={isSelected ? 2 : 1.5}
          className="cursor-pointer"
          onClick={() => setSelectedDockId(dock.id)}
        />
      );

      // Label
      const label = (
        <text
          x={center.x} y={center.y + 4}
          textAnchor="middle"
          fill="white" fontSize={12} fontWeight={700}
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
          className="pointer-events-none"
        >
          {dock.name} ({dock.slipCount})
        </text>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
