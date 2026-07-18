"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Glasses, Crosshair, Save, Trash2, Satellite, Map, Loader2, RotateCcw, Search, Navigation, Pencil } from "lucide-react";

interface DetectedDock {
  id: string;
  name: string;
  x: number;
  y: number;
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
  x: number;
  y: number;
  width: number;
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [docks, setDocks] = useState<DetectedDock[]>([]);
  const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Newport Beach, CA");
  const [lngLat, setLngLat] = useState<[number, number]>([-117.92, 33.62]);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);

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
      // Cleanup
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
      setMapError("Mapbox SDK not available. Using fallback view.");
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token || token === "placeholder") {
      setMapError("Mapbox token not configured. Using satellite simulation.");
      return;
    }

    try {
      window.mapboxgl.accessToken = token;
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: lngLat,
        zoom: 17,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      map.addControl(new window.mapboxgl.NavigationControl(), "top-right");
      map.addControl(new window.mapboxgl.ScaleControl(), "bottom-left");

      map.on("load", () => {
        mapRef.current = map;
        setMapError(null);
      });

      map.on("error", (e: any) => {
        console.error("Map error:", e);
        setMapError("Map display issue. Some features may be limited.");
      });

      map.on("moveend", () => {
        const center = map.getCenter();
        setLngLat([center.lng, center.lat]);
      });
    } catch (err) {
      console.error("Map init error:", err);
      setMapError("Failed to initialize map. Using satellite simulation.");
    }
  }, [mapLoaded, lngLat]);

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

  // AI Detection
  const runAIDetection = async () => {
    setIsDetecting(true);

    try {
      // Capture current map view as image
      let imageUrl: string | null = null;
      if (mapRef.current) {
        imageUrl = mapRef.current.getCanvas().toDataURL("image/png");
      }

      const res = await fetch("/api/ai/detect-docks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          latitude: lngLat[1],
          longitude: lngLat[0],
          zoom: mapRef.current?.getZoom() || 17,
        }),
      });

      const json = await res.json();
      if (json.data?.suggestions) {
        const newDocks = json.data.suggestions.map((s: MapSuggestion) => ({
          id: genDockId(),
          ...s,
        }));
        setDocks((prev) => {
          const existing = [...prev];
          newDocks.forEach((nd: DetectedDock) => {
            if (!existing.find((d) => d.name === nd.name)) {
              existing.push(nd);
            }
          });
          return existing;
        });
      }
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      setIsDetecting(false);
    }
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
            variant={drawing ? "default" : "outline"}
            size="sm"
            onClick={() => setDrawing(!drawing)}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            {drawing ? "Drawing..." : "Draw Dock"}
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={runAIDetection}
            loading={isDetecting}
          >
            <Glasses className="h-4 w-4 mr-1.5" />
            {isDetecting ? "AI Analyzing..." : "AI Detect Docks"}
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
                {mapError && (
                  <Badge variant="outline" className="text-[10px] text-yellow-500">
                    Fallback mode
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
              style={{ height: "520px", background: "#0a1628" }}
              onMouseDown={(e) => {
                if (!drawing || !mapRef.current) return;
                const rect = mapContainerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setDrawStart({ x, y });
                setDrawEnd({ x, y });
              }}
              onMouseMove={(e) => {
                if (!drawing || !drawStart || !mapRef.current) return;
                const rect = mapContainerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setDrawEnd({ x, y });
              }}
              onMouseUp={() => {
                if (!drawing || !drawStart || !drawEnd || !mapRef.current) return;
                const x = Math.min(drawStart.x, drawEnd.x);
                const y = Math.min(drawStart.y, drawEnd.y);
                const w = Math.abs(drawEnd.x - drawStart.x);
                const h = Math.abs(drawEnd.y - drawStart.y);
                if (w < 10 || h < 10) {
                  setDrawStart(null);
                  setDrawEnd(null);
                  return;
                }
                const colorIdx = docks.length % DOCK_COLORS.length;
                const newDock: DetectedDock = {
                  id: genDockId(),
                  name: `Dock ${String.fromCharCode(65 + docks.length)}`,
                  x, y, width: w, height: h,
                  color: DOCK_COLORS[colorIdx],
                  slipCount: 4,
                  slipLength: 40,
                  slipWidth: 14,
                  dailyRate: 3.5,
                  monthlyRate: 75,
                };
                setDocks((prev) => [...prev, newDock]);
                setDrawStart(null);
                setDrawEnd(null);
                setDrawing(false);
              }}
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

              {/* Overlay dock markers when map is loaded */}
              {mapLoaded && !mapError && (docks.length > 0 || (drawing && drawStart && drawEnd)) && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <svg className="w-full h-full">
                    {docks.map((dock) => {
                      const isSelected = selectedDockId === dock.id;
                      return (
                        <g key={dock.id}>
                          <rect
                            x={dock.x}
                            y={dock.y}
                            width={dock.width}
                            height={dock.height}
                            rx={4}
                            fill={dock.color}
                            fillOpacity={isSelected ? 0.6 : 0.35}
                            stroke={isSelected ? "#ffffff" : dock.color}
                            strokeWidth={isSelected ? 3 : 2}
                            className="pointer-events-auto cursor-pointer"
                            onClick={() => setSelectedDockId(dock.id)}
                          />
                          <text
                            x={dock.x + dock.width / 2}
                            y={dock.y + dock.height / 2 + 4}
                            textAnchor="middle"
                            fill="white"
                            fontSize={12}
                            fontWeight={700}
                            className="pointer-events-none"
                            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                          >
                            {dock.name} ({dock.slipCount} slips)
                          </text>
                          {dock.confidence && (
                            <text
                              x={dock.x + dock.width - 4}
                              y={dock.y - 4}
                              textAnchor="end"
                              fill="#a3e635"
                              fontSize={9}
                              className="pointer-events-none"
                              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                            >
                              {(dock.confidence * 100).toFixed(0)}% match
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* Drawing preview */}
                    {drawing && drawStart && drawEnd && (
                      <rect
                        x={Math.min(drawStart.x, drawEnd.x)}
                        y={Math.min(drawStart.y, drawEnd.y)}
                        width={Math.abs(drawEnd.x - drawStart.x)}
                        height={Math.abs(drawEnd.y - drawStart.y)}
                        rx={4}
                        fill="white"
                        fillOpacity={0.15}
                        stroke="white"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                      />
                    )}
                  </svg>
                </div>
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
                    <label className="text-xs font-medium mb-1 block">X Position</label>
                    <Input
                      type="number"
                      value={Math.round(selectedDock.x)}
                      onChange={(e) => updateDock(selectedDock.id, "x", parseInt(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Y Position</label>
                    <Input
                      type="number"
                      value={Math.round(selectedDock.y)}
                      onChange={(e) => updateDock(selectedDock.id, "y", parseInt(e.target.value) || 0)}
                      className="h-9 text-sm"
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
                    ? "Search for a marina location, then click 'AI Detect Docks' to automatically find docks from satellite imagery"
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