"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
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

  const FINGER_HEIGHT = 48;
  const FINGER_WIDTH = 12;
  const FINGER_GAP = 6;
  const WALKWAY_HEIGHT = 8;
  const PADDING = 60;

  // Calculate map dimensions
  const maxX = Math.max(...docks.flatMap(d => d.slips.map((s, i) => (s.positionX || 0) + i * (FINGER_WIDTH + FINGER_GAP))), 800);
  const maxY = Math.max(...docks.map((d, i) => i * 120 + 100), 400);

  return (
    <div className="relative overflow-x-auto">
      <div className="relative" style={{ minWidth: `${maxX + PADDING * 2}px`, minHeight: `${maxY + PADDING}px` }}>
        {/* Water background with subtle grid */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: "linear-gradient(180deg, rgba(6,78,120,0.08) 0%, rgba(2,136,209,0.04) 50%, rgba(6,78,120,0.08) 100%)",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Docks and slips */}
        {docks.map((dock, dockIdx) => {
          const dockY = dockIdx * 120 + 20;
          const dockX = PADDING;
          const totalWidth = dock.slips.length * (FINGER_WIDTH + FINGER_GAP);

          return (
            <div key={dock.id}>
              {/* Dock walkway */}
              <div
                className="absolute rounded-full"
                style={{
                  left: `${dockX}px`,
                  top: `${dockY + FINGER_HEIGHT + 4}px`,
                  width: `${Math.max(totalWidth, 40)}px`,
                  height: `${WALKWAY_HEIGHT}px`,
                  backgroundColor: dock.color,
                  opacity: 0.8,
                  boxShadow: `0 0 8px ${dock.color}40`,
                }}
              />

              {/* Dock label */}
              <div
                className="absolute flex items-center gap-2 px-2.5 py-1 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50 text-xs font-medium z-10 shadow-sm"
                style={{
                  left: `${dockX}px`,
                  top: `${dockY + FINGER_HEIGHT - 2}px`,
                  transform: "translateY(-100%)",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dock.color }} />
                <span>{dock.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {dock.slips.filter(s => s.status === "AVAILABLE").length}/{dock.slips.length}
                </span>
              </div>

              {/* Finger piers (slips) extending upward from walkway */}
              {dock.slips.map((slip, idx) => {
                const colors = statusColors[slip.status];
                const isSelected = selectedSlipId === slip.id;
                const isHovered = hoveredSlip?.id === slip.id;
                const slipX = dockX + idx * (FINGER_WIDTH + FINGER_GAP) + 1;

                return (
                  <div key={slip.id} className="absolute" style={{
                    left: `${slipX}px`,
                    top: `${dockY + 4}px`,
                  }}>
                    {/* Finger pier */}
                    <button
                      onClick={() => onSlipClick?.(slip)}
                      onMouseEnter={() => setHoveredSlip(slip)}
                      onMouseLeave={() => setHoveredSlip(null)}
                      className={cn(
                        "block rounded-sm border-2 transition-all duration-200 cursor-pointer",
                        colors.border,
                        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background z-20 scale-110",
                        isHovered && !isSelected && "z-20 shadow-lg",
                      )}
                      style={{
                        width: `${FINGER_WIDTH}px`,
                        height: `${FINGER_HEIGHT}px`,
                        backgroundColor: colors.bg,
                      }}
                    >
                      <span className={cn(
                        "block text-[7px] font-bold leading-none text-center mt-1",
                        colors.text
                      )}>
                        {slip.number?.replace("'", "") || idx + 1}
                      </span>
                    </button>

                    {/* Hover tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50" style={{ pointerEvents: "none" }}>
                        <GlassCard className="p-2.5 min-w-[160px] text-xs shadow-xl" hover={false}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">{slip.name}</span>
                            <Badge variant={
                              slip.status === "AVAILABLE" ? "success" :
                              slip.status === "OCCUPIED" ? "info" :
                              slip.status === "RESERVED" ? "warning" : "danger"
                            } className="text-[10px]">
                              {colors.label}
                            </Badge>
                          </div>
                          <div className="space-y-0.5 text-muted-foreground">
                            <p>{slip.length}&apos; x {slip.width || "—"}&apos; | Max draft: {slip.maxDraft || "—"}&apos;</p>
                            <div className="flex gap-1.5 mt-1">
                              {slip.hasPower && <Zap className="h-3 w-3 text-yellow-400" />}
                              {slip.hasWater && <Waves className="h-3 w-3 text-blue-400" />}
                              {slip.hasWiFi && <Wifi className="h-3 w-3 text-green-400" />}
                              {slip.hasCable && <Cable className="h-3 w-3 text-orange-400" />}
                            </div>
                          </div>
                        </GlassCard>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

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