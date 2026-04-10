"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import { getEventLabel } from "@/lib/time-entry-validation";
import type { EventType } from "@/lib/time-entry-validation";

export interface DayEntryDetail {
  id: string;
  event_type: EventType;
  timestamp_server: string;
  time: string;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface DayDetailDialogProps {
  open: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  entries: DayEntryDetail[];
}

const EVENT_COLORS: Record<EventType, string> = {
  entrada: "bg-green-100 text-green-700 border-green-300",
  saida_almoco: "bg-amber-100 text-amber-700 border-amber-300",
  volta_almoco: "bg-blue-100 text-blue-700 border-blue-300",
  saida: "bg-red-100 text-red-700 border-red-300",
};

// Distance threshold (in degrees, ~50m) — coords within this radius are
// considered the same location.
const SAME_LOCATION_THRESHOLD = 0.0005;

function isSameLocation(
  a: DayEntryDetail,
  b: DayEntryDetail
): boolean {
  if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return true;
  return (
    Math.abs(a.latitude - b.latitude) < SAME_LOCATION_THRESHOLD &&
    Math.abs(a.longitude - b.longitude) < SAME_LOCATION_THRESHOLD
  );
}

export function DayDetailDialog({
  open,
  onClose,
  date,
  entries,
}: DayDetailDialogProps) {
  const withCoords = useMemo(
    () => entries.filter((e) => e.latitude && e.longitude),
    [entries]
  );

  // Detect if there are meaningfully different locations
  const hasDivergentLocations = useMemo(() => {
    if (withCoords.length < 2) return false;
    const first = withCoords[0];
    return withCoords.some((e) => !isSameLocation(first, e));
  }, [withCoords]);

  // Currently selected entry index (in the entries array)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default to first entry with coords (or first entry overall)
  useEffect(() => {
    if (!open) return;
    const defaultEntry = withCoords[0] || entries[0];
    setSelectedId(defaultEntry?.id ?? null);
  }, [open, entries, withCoords]);

  const selectedEntry = entries.find((e) => e.id === selectedId) || null;
  const displayEntry =
    selectedEntry && selectedEntry.latitude && selectedEntry.longitude
      ? selectedEntry
      : withCoords[0] || null;

  const mapUrl = useMemo(() => {
    if (!displayEntry || !displayEntry.latitude || !displayEntry.longitude) {
      return null;
    }
    const lat = displayEntry.latitude;
    const lng = displayEntry.longitude;
    const delta = 0.005;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  }, [displayEntry]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do dia</DialogTitle>
          <DialogDescription>{formatDateLabel(date)}</DialogDescription>
        </DialogHeader>

        {/* Divergent locations alert */}
        {hasDivergentLocations && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">
              As marcações foram feitas em <strong>locais diferentes</strong>.
              Toque em cada evento abaixo para ver no mapa.
            </p>
          </div>
        )}

        {/* Map */}
        {mapUrl && displayEntry ? (
          <div className="space-y-2">
            <div className="rounded-lg overflow-hidden border h-48">
              <iframe
                key={displayEntry.id}
                src={mapUrl}
                className="w-full h-full"
                title="Mapa das marcações"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Mostrando: <strong>{getEventLabel(displayEntry.event_type)}</strong>
              </span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${displayEntry.latitude}&mlon=${displayEntry.longitude}#map=17/${displayEntry.latitude}/${displayEntry.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Abrir em nova aba
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
            <MapPin className="mx-auto h-5 w-5 mb-1" />
            Nenhuma localização registrada neste dia
          </div>
        )}

        {/* Entries list */}
        <div className="space-y-2">
          {entries.map((entry) => {
            const hasCoords = !!(entry.latitude && entry.longitude);
            const isSelected = selectedId === entry.id;

            return (
              <button
                key={entry.id}
                type="button"
                disabled={!hasCoords}
                className={`w-full text-left rounded-lg border p-3 space-y-1 transition-colors ${
                  isSelected && hasCoords
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                } ${!hasCoords ? "cursor-default opacity-70" : "cursor-pointer"}`}
                onClick={() => hasCoords && setSelectedId(entry.id)}
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={EVENT_COLORS[entry.event_type]}
                  >
                    {getEventLabel(entry.event_type)}
                  </Badge>
                  <span className="font-mono text-sm font-semibold">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {entry.time}
                  </span>
                </div>
                {entry.note && (
                  <p className="text-xs italic text-muted-foreground">
                    {entry.note}
                  </p>
                )}
                {hasCoords ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {entry.latitude!.toFixed(5)}, {entry.longitude!.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Sem localização
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
