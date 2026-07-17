"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Ship, Anchor, Zap, Waves, Wifi, Cable, ParkingCircle } from "lucide-react";

type SlipStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "UNAVAILABLE";

interface SlipData {
  id: string;
  name: string;
  number: string;
  length: number;
  width: number | null;
  maxDraft: number | null;
  hasPower: boolean;
  hasWater: boolean;
  hasWiFi: boolean;
  hasCable: boolean;
  status: SlipStatus;
  positionX: number | null;
  positionY: number | null;
  widthPixels: number | null;
  heightPixels: number | null;
  rotation: number | null;
  dockId: string;
  dockName?: string;
}

interface DockData {
  id: string;
  name: string;
  color: string;
  slips: SlipData[];
}

const statusColors: Record<SlipStatus, { bg: string; border: string; text: string; label: string }> = {
  AVAILABLE: { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-400", label: "Available" },
  OCCUPIED: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400", label: "Occupied" },
  RESERVED: { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400", label: "Reserved" },
  MAINTENANCE: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400", label: "Maintenance" },
  UNAVAILABLE: { bg: "bg-gray-500/20", border: "border-gray-500/40", text: "text-gray-400", label: "Unavailable" },
};

interface InteractiveSlipMapProps {
  docks: DockData[];
  onSlipClick?: (slip: SlipData) => void;
  selectedSlipId?: string | null;
}

export function InteractiveSlipMap({ docks, onSlipClick, selectedSlipId }: InteractiveSlipMapProps) {
  const [hoveredSlip, setHoveredSlip] = useState<SlipData | null>(null);

  // Calculate map dimensions
  const maxX = Math.max(...docks.flatMap(d => d.slips.map(s => s.positionX || 0)), 800);
  const maxY = Math.max(...docks.flatMap(d => d.slips.map(s => s.positionY || 0)), 400);

  return (
    <div className="relative overflow-x-auto">
      <div className="relative" style={{ minWidth: `${maxX + 200}px`, minHeight: `${maxY + 150}px` }}>
        {/* Water background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-blue-400/5 to-blue-600/5 rounded-2xl" />

        {/* Docks and slips */}
        {docks.map((dock) => (
          <div key={dock.id}>
            {/* Dock label */}
            <div
              className="absolute flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border text-sm font-medium z-10"
              style={{
                left: `${(dock.slips[0]?.positionX || 0)}px`,
                top: `${Math.max(0, (dock.slips[0]?.positionY || 0) - 32)}px`,
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dock.color }} />
              {dock.name}
              <span className="text-muted-foreground text-xs">
                {dock.slips.filter(s => s.status === "AVAILABLE").length}/{dock.slips.length}
              </span>
            </div>

            {/* Dock line */}
            <div
              className="absolute h-0.5 rounded-full opacity-40"
              style={{
                left: `${dock.slips[0]?.positionX || 0}px`,
                top: `${(dock.slips[0]?.positionY || 0) + 20}px`,
                width: `${dock.slips.length * 90}px`,
                backgroundColor: dock.color,
              }}
            />

            {/* Slips */}
            {dock.slips.map((slip) => {
              const colors = statusColors[slip.status];
              const isSelected = selectedSlipId === slip.id;
              const isHovered = hoveredSlip?.id === slip.id;

              return (
                <div key={slip.id} className="absolute" style={{
                  left: `${slip.positionX || 0}px`,
                  top: `${slip.positionY || 0}px`,
                }}>
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                      <GlassCard className="p-3 min-w-[180px] text-xs shadow-xl" hover={false}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-sm">{slip.name}</span>
                          <Badge variant={
                            slip.status === "AVAILABLE" ? "success" :
                            slip.status === "OCCUPIED" ? "info" :
                            slip.status === "RESERVED" ? "warning" :
                            "danger"
                          } className="text-[10px]">
                            {colors.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-muted-foreground">
                          <p>{slip.length}&apos; × {slip.width || "—"}&apos;</p>
                          <p>Max draft: {slip.maxDraft || "—"}&apos;</p>
                          <div className="flex gap-2 mt-1">
                            {slip.hasPower && <Zap className="h-3 w-3 text-yellow-400" />}
                            {slip.hasWater && <Waves className="h-3 w-3 text-blue-400" />}
                            {slip.hasWiFi && <Wifi className="h-3 w-3 text-green-400" />}
                            {slip.hasCable && <Cable className="h-3 w-3 text-orange-400" />}
                          </div>
                          {slip.dockName && (
                            <p className="text-[10px] text-muted-foreground mt-1">Dock: {slip.dockName}</p>
                          )}
                        </div>
                      </GlassCard>
                    </div>
                  )}

                  <button
                    onClick={() => onSlipClick?.(slip)}
                    onMouseEnter={() => setHoveredSlip(slip)}
                    onMouseLeave={() => setHoveredSlip(null)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200 cursor-pointer",
                      colors.bg,
                      colors.border,
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110",
                      isHovered && !isSelected && "scale-105 shadow-lg",
                      "hover:shadow-md"
                    )}
                    style={{
                      width: `${slip.widthPixels || 70}px`,
                      height: `${slip.heightPixels || 32}px`,
                      transform: slip.rotation ? `rotate(${slip.rotation}deg)` : undefined,
                    }}
                  >
                    <span className={cn("text-[10px] font-bold leading-none", colors.text)}>
                      {slip.name.split("-")[1]}
                    </span>
                    <span className="text-[8px] text-muted-foreground leading-none mt-0.5">
                      {slip.length}&apos;
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {/* Empty state */}
        {docks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
            <Anchor className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No docks configured yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Add your first dock and slips to see the interactive map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}