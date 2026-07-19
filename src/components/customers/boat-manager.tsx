"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalClose } from "@/components/ui/modal";
import { Ship, Anchor, Plus, Calendar, AlertTriangle, FileText, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Boat {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  length: number;
  isPrimary: boolean;
  insurance?: Insurance | null;
}

interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  expirationDate: string | null;
  isVerified: boolean;
}

interface BoatManagerProps {
  boats: Boat[];
  onAddBoat: (boat: { name: string; make: string; model: string; year: number; length: number }) => void;
  onDeleteBoat: (id: string) => void;
  onAddInsurance: (boatId: string, insurance: { provider: string; policyNumber: string; expirationDate: string }) => void;
}

export function BoatManager({ boats, onAddBoat, onDeleteBoat, onAddInsurance }: BoatManagerProps) {
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [showInsurance, setShowInsurance] = useState<string | null>(null);
  const [newBoat, setNewBoat] = useState({ name: "", make: "", model: "", year: new Date().getFullYear(), length: 30 });
  const [newInsurance, setNewInsurance] = useState({ provider: "", policyNumber: "", expirationDate: "" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold">Boats</h3>
        <Button size="sm" onClick={() => setShowAddBoat(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Boat
        </Button>
      </div>

      {boats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Ship className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No boats registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {boats.map((boat) => (
            <GlassCard key={boat.id} className="p-4" hover={false}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{boat.name}</p>
                      {boat.isPrimary && (
                        <Badge variant="info" className="text-[10px]">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {boat.make} {boat.model} {boat.year && `(${boat.year})`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteBoat(boat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Anchor className="h-3 w-3" />
                  {boat.length}&apos;
                </span>
              </div>

              {/* Insurance section */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Insurance</span>
                  {!boat.insurance && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setShowInsurance(boat.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
                {boat.insurance ? (
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <Badge variant={boat.insurance.expirationDate && new Date(boat.insurance.expirationDate) < new Date() ? "danger" : "success"} className="text-[10px]">
                      {boat.insurance.expirationDate && new Date(boat.insurance.expirationDate) < new Date() ? "Expired" : "Active"}
                    </Badge>
                    <span>{boat.insurance.provider}</span>
                    <span className="text-muted-foreground">
                      Exp: {boat.insurance.expirationDate ? formatDate(boat.insurance.expirationDate) : "—"}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">No insurance on file</p>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Add Boat Modal */}
      <Modal open={showAddBoat} onOpenChange={setShowAddBoat}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Register a Boat</ModalTitle>
            <ModalDescription>Add a boat to this customer&apos;s profile</ModalDescription>
          </ModalHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Boat Name</label>
              <Input value={newBoat.name} onChange={(e) => setNewBoat({ ...newBoat, name: e.target.value })} placeholder="e.g. M/Y Serenity" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Make</label>
                <Input value={newBoat.make} onChange={(e) => setNewBoat({ ...newBoat, make: e.target.value })} placeholder="e.g. Sea Ray" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Model</label>
                <Input value={newBoat.model} onChange={(e) => setNewBoat({ ...newBoat, model: e.target.value })} placeholder="e.g. Sundancer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Year</label>
                <Input type="number" value={newBoat.year} onChange={(e) => setNewBoat({ ...newBoat, year: parseInt(e.target.value) || 2024 })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Length (ft)</label>
                <Input type="number" value={newBoat.length} onChange={(e) => setNewBoat({ ...newBoat, length: parseInt(e.target.value) || 30 })} />
              </div>
            </div>
          </div>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
            <Button onClick={() => { onAddBoat(newBoat); setShowAddBoat(false); setNewBoat({ name: "", make: "", model: "", year: new Date().getFullYear(), length: 30 }); }} disabled={!newBoat.name}>
              Register Boat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Insurance Modal */}
      <Modal open={!!showInsurance} onOpenChange={(open) => !open && setShowInsurance(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add Insurance</ModalTitle>
            <ModalDescription>Enter insurance details for this boat</ModalDescription>
          </ModalHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Provider</label>
              <Input value={newInsurance.provider} onChange={(e) => setNewInsurance({ ...newInsurance, provider: e.target.value })} placeholder="e.g. State Farm" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Policy Number</label>
              <Input value={newInsurance.policyNumber} onChange={(e) => setNewInsurance({ ...newInsurance, policyNumber: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Expiration Date</label>
              <Input type="date" value={newInsurance.expirationDate} onChange={(e) => setNewInsurance({ ...newInsurance, expirationDate: e.target.value })} />
            </div>
          </div>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Cancel</Button></ModalClose>
            <Button onClick={() => { if (showInsurance) { onAddInsurance(showInsurance, newInsurance); setShowInsurance(null); setNewInsurance({ provider: "", policyNumber: "", expirationDate: "" }); } }} disabled={!newInsurance.provider || !newInsurance.policyNumber}>
              Add Insurance
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}