"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Globe,
  Crosshair,
  MousePointer2,
  Save,
  Trash2,
  Ship,
  Anchor,
  Zap,
  Waves,
  RotateCcw,
  Check,
  Loader2,
  Plus,
  Satellite,
} from "lucide-react";

// === Types ===

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
}

interface SlipPosition {
  id: string;
  name: string;
  x: number;
  y: number;
}

type Tool = "select" | "draw" | "pan";

const DOCK_COLORS = [
  "#0284c7", "#059669", "#d97706", "#7c3aed",
  "#dc2626", "#0891b2", "#65a30d", "#0d9488",
  "#e11d48", "#4f46e5",
];

// === Helpers ===

let dockIdCounter = 0;
function genDockId() {
  dockIdCounter += 1;
  return `detected-dock-${dockIdCounter}`;
}

function getSlipPositions(dock: DetectedDock): SlipPosition[] {
  const positions: SlipPosition[] = [];
  const slipSpacing = dock.width / dock.slipCount;
  for (let i = 0; i < dock.slipCount; i++) {
    positions.push({
      id: `${dock.id}-slip-${i + 1}`,
      name: `${dock.name}-${i + 1}`,
      x: dock.x + i * slipSpacing + slipSpacing / 2 - 3,
      y: dock.y + dock.height / 2 - 8,
    });
  }
  return positions;
}

// === Component ===

export function SatelliteDockDetection() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [docks, setDocks] = useState<DetectedDock[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("draw");
  const [isDetecting, setIsDetecting] = useState(false);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Water animation cycles
  const [waterPhase, setWaterPhase] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setWaterPhase((p) => (p + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getSvgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - mapOffset.x) / zoom,
        y: (clientY - rect.top - mapOffset.y) / zoom,
      };
    },
    [mapOffset, zoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (activeTool === "pan") {
        setIsPanning(true);
        setPanStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
        return;
      }

      const pt = getSvgPoint(e.clientX, e.clientY);
      // Check if clicking on existing dock
      const clickedDock = docks.find(
        (d) =>
          pt.x >= d.x &&
          pt.x <= d.x + d.width &&
          pt.y >= d.y &&
          pt.y <= d.y + d.height
      );
      if (clickedDock) {
        setSelectedDockId(clickedDock.id);
        return;
      }

      setSelectedDockId(null);

      if (activeTool === "draw") {
        setDrawing({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
      }
    },
    [activeTool, docks, getSvgPoint, mapOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setMapOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (!drawing) return;
      const pt = getSvgPoint(e.clientX, e.clientY);
      setDrawing((prev) => prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null);
    },
    [drawing, isPanning, panStart, getSvgPoint]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!drawing) return;

    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const w = Math.abs(drawing.currentX - drawing.startX);
    const h = Math.abs(drawing.currentY - drawing.startY);

    if (w > 20 && h > 10) {
      const idx = docks.length;
      const newDock: DetectedDock = {
        id: genDockId(),
        name: `Dock ${String.fromCharCode(65 + idx)}`,
        x,
        y,
        width: w,
        height: h,
        color: DOCK_COLORS[idx % DOCK_COLORS.length],
        slipCount: Math.max(1, Math.floor(w / 20)),
        slipLength: 40,
        slipWidth: 14,
        dailyRate: 3.5,
        monthlyRate: 85,
      };
      setDocks((prev) => [...prev, newDock]);
      setSelectedDockId(newDock.id);
    }
    setDrawing(null);
  }, [drawing, docks.length, isPanning]);

  const removeDock = (id: string) => {
    setDocks((prev) => prev.filter((d) => d.id !== id));
    if (selectedDockId === id) setSelectedDockId(null);
  };

  const updateDock = (id: string, field: keyof DetectedDock, value: number | string) => {
    setDocks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const clearAll = () => {
    setDocks([]);
    setSelectedDockId(null);
    setDrawing(null);
  };

  // AI Detection Simulation
  const runAIDetection = async () => {
    setIsDetecting(true);
    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 2000));

    // Generate smart dock suggestions based on the viewport
    const viewW = 800 / zoom;
    const viewH = 500 / zoom;

    const suggestions: DetectedDock[] = [
      {
        id: genDockId(),
        name: "Alpha Dock",
        x: 50,
        y: 120,
        width: 300,
        height: 30,
        color: "#0284c7",
        slipCount: 6,
        slipLength: 40,
        slipWidth: 14,
        dailyRate: 3.5,
        monthlyRate: 85,
      },
      {
        id: genDockId(),
        name: "Bravo Dock",
        x: 50,
        y: 240,
        width: 240,
        height: 30,
        color: "#059669",
        slipCount: 4,
        slipLength: 45,
        slipWidth: 15,
        dailyRate: 4.0,
        monthlyRate: 95,
      },
      {
        id: genDockId(),
        name: "Charlie Dock",
        x: 50,
        y: 360,
        width: 180,
        height: 28,
        color: "#d97706",
        slipCount: 3,
        slipLength: 35,
        slipWidth: 13,
        dailyRate: 3.0,
        monthlyRate: 75,
      },
    ];

    setDocks(suggestions);
    setSelectedDockId(null);
    setIsDetecting(false);
  };

  const selectedDock = docks.find((d) => d.id === selectedDockId);

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTool === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("draw")}
          >
            <MousePointer2 className="h-4 w-4 mr-1.5" />
            Draw Docks
          </Button>
          <Button
            variant={activeTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("select")}
          >
            <Crosshair className="h-4 w-4 mr-1.5" />
            Select
          </Button>
          <Button
            variant={activeTool === "pan" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTool("pan")}
          >
            <Anchor className="h-4 w-4 mr-1.5" />
            Pan
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={runAIDetection}
            loading={isDetecting}
          >
            <Satellite className="h-4 w-4 mr-1.5" />
            {isDetecting ? "Analyzing..." : "AI Detect Docks"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={docks.length === 0}
          >
            {saveSuccess ? (
              <><Check className="h-4 w-4 mr-1.5" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4 mr-1.5" /> Save Layout</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Satellite Map */}
        <div className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden" hover={false}>
            <div className="p-3 border-b border-border bg-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Satellite View</span>
                  <Badge variant="outline" className="text-[10px]">
                    {zoom.toFixed(1)}x
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                    +
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                    -
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative" style={{ height: "500px", cursor: activeTool === "pan" ? "grab" : activeTool === "draw" ? "crosshair" : "default" }}>
              <svg
                ref={svgRef}
                className="w-full h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Water background */}
                <defs>
                  <pattern id="waterPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="#0a1628" />
                    <circle cx="20" cy="30" r="2" fill="#1a3a6a" opacity="0.3" />
                    <circle cx="60" cy="70" r="1.5" fill="#1a4a7a" opacity="0.2" />
                    <circle cx="80" cy="20" r="1" fill="#1a3a6a" opacity="0.3" />
                    <circle cx="40" cy="80" r="1.5" fill="#1a4a7a" opacity="0.2" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#waterPattern)" />
                {/* Wave overlay */}
                <rect width="100%" height="100%" fill={`rgba(20,60,120,${0.02 + Math.sin(waterPhase * 0.05) * 0.01})`} />

                {/* Grid lines for reference */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * 80}
                    y1={0}
                    x2={i * 80}
                    y2={500}
                    stroke="#ffffff"
                    strokeOpacity={0.03}
                    strokeWidth={1}
                  />
                ))}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1={0}
                    y1={i * 60}
                    x2={1600}
                    y2={i * 60}
                    stroke="#ffffff"
                    strokeOpacity={0.03}
                    strokeWidth={1}
                  />
                ))}

                {/* Pan offset group */}
                <g transform={`translate(${mapOffset.x}, ${mapOffset.y}) scale(${zoom})`}>
                  {/* Drawn Docks */}
                  {docks.map((dock, idx) => {
                    const slipPositions = getSlipPositions(dock);
                    const isSelected = selectedDockId === dock.id;

                    return (
                      <g key={dock.id}>
                        {/* Dock rectangle */}
                        <rect
                          x={dock.x}
                          y={dock.y}
                          width={dock.width}
                          height={dock.height}
                          rx={4}
                          fill={dock.color}
                          fillOpacity={isSelected ? 0.5 : 0.3}
                          stroke={isSelected ? "#ffffff" : dock.color}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={isSelected ? "none" : "none"}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedDockId(dock.id)}
                        />
                        {/* Dock label */}
                        <text
                          x={dock.x + dock.width / 2}
                          y={dock.y + dock.height / 2 + 4}
                          textAnchor="middle"
                          fill="white"
                          fontSize={11}
                          fontWeight={600}
                          fontFamily="system-ui"
                        >
                          {dock.name}
                        </text>

                        {/* Slip positions */}
                        {slipPositions.map((slip) => (
                          <g key={slip.id}>
                            <rect
                              x={slip.x}
                              y={slip.y}
                              width={6}
                              height={16}
                              rx={1}
                              fill={dock.color}
                              fillOpacity={0.6}
                              stroke="white"
                              strokeWidth={0.5}
                              strokeOpacity={0.3}
                            />
                            <text
                              x={slip.x + 3}
                              y={slip.y + 11}
                              textAnchor="middle"
                              fill="white"
                              fontSize={5}
                              fontFamily="monospace"
                            >
                              {slip.name.split("-").pop()}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })}

                  {/* Current drawing rectangle */}
                  {drawing && (
                    <rect
                      x={Math.min(drawing.startX, drawing.currentX)}
                      y={Math.min(drawing.startY, drawing.currentY)}
                      width={Math.abs(drawing.currentX - drawing.startX)}
                      height={Math.abs(drawing.currentY - drawing.startY)}
                      rx={4}
                      fill="white"
                      fillOpacity={0.1}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeDasharray="6,3"
                    />
                  )}

                  {/* Coordinate origin hint */}
                  <text x={5} y={12} fill="white" fillOpacity={0.3} fontSize={9} fontFamily="monospace">
                    0,0
                  </text>
                </g>
              </svg>
            </div>
          </GlassCard>
        </div>

        {/* Dock Properties Panel */}
        <div className="space-y-4">
          <GlassCard hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <Anchor className="h-4 w-4 text-primary" />
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
                    <label className="text-xs font-medium mb-1 block">Width (px)</label>
                    <Input
                      type="number"
                      value={Math.round(selectedDock.width)}
                      onChange={(e) => updateDock(selectedDock.id, "width", parseInt(e.target.value) || 10)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Height (px)</label>
                    <Input
                      type="number"
                      value={Math.round(selectedDock.height)}
                      onChange={(e) => updateDock(selectedDock.id, "height", parseInt(e.target.value) || 10)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Slip Length (ft)</label>
                    <Input
                      type="number"
                      value={selectedDock.slipLength}
                      onChange={(e) => updateDock(selectedDock.id, "slipLength", parseFloat(e.target.value) || 20)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Slip Width (ft)</label>
                    <Input
                      type="number"
                      value={selectedDock.slipWidth}
                      onChange={(e) => updateDock(selectedDock.id, "slipWidth", parseFloat(e.target.value) || 10)}
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
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                    <MousePointer2 className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {docks.length === 0
                    ? "Click and drag on the satellite view to draw a dock, or use AI Detect to auto-find docks"
                    : "Click on a dock to edit its properties"}
                </p>
              </div>
            )}
          </GlassCard>

          {/* Detection info */}
          <GlassCard hover={false}>
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
                <span className="font-medium">
                  {docks.reduce((s, d) => s + d.slipCount, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. monthly revenue</span>
                <span className="font-medium">
                  ${(docks.reduce((s, d) => s + d.slipCount * d.monthlyRate, 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
