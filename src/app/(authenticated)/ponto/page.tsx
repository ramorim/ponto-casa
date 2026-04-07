"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  LogIn,
  UtensilsCrossed,
  RotateCcw,
  LogOut,
  ChevronDown,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  ALL_EVENT_TYPES,
  getNextAllowedEvents,
  getEventLabel,
} from "@/lib/time-entry-validation";
import type { EventType } from "@/lib/time-entry-validation";

interface TimeEntry {
  id: string;
  event_type: EventType;
  timestamp_server: string;
  note: string | null;
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  entrada: <LogIn className="h-6 w-6" />,
  saida_almoco: <UtensilsCrossed className="h-6 w-6" />,
  volta_almoco: <RotateCcw className="h-6 w-6" />,
  saida: <LogOut className="h-6 w-6" />,
};

const EVENT_COLORS: Record<EventType, string> = {
  entrada: "bg-green-600 hover:bg-green-700 text-white",
  saida_almoco: "bg-amber-500 hover:bg-amber-600 text-white",
  volta_almoco: "bg-blue-500 hover:bg-blue-600 text-white",
  saida: "bg-red-600 hover:bg-red-700 text-white",
};

export default function PontoPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [allowedEvents, setAllowedEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [punchingType, setPunchingType] = useState<EventType | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [serverTime, setServerTime] = useState<string>("");

  const fetchTodayEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/time-entries/today");
      if (!res.ok) throw new Error();
      const data: TimeEntry[] = await res.json();
      setEntries(data);

      const lastEvent = data.length > 0 ? data[data.length - 1].event_type : null;
      setAllowedEvents(getNextAllowedEvents(lastEvent));
    } catch {
      toast.error("Erro ao carregar registros do dia");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayEntries();
  }, [fetchTodayEntries]);

  // Update displayed time every second
  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setServerTime(
        now.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handlePunch(eventType: EventType) {
    setPunchingType(eventType);

    // Capture geolocation (optional, don't block)
    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 60000,
        });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      // Geolocation denied or unavailable — proceed without it
    }

    const deviceInfo = navigator.userAgent.slice(0, 200);

    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          latitude,
          longitude,
          device_info: deviceInfo,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao registrar ponto");
        setPunchingType(null);
        return;
      }

      const time = formatTime(data.timestamp_server);
      toast.success(`${getEventLabel(eventType)} registrada às ${time}`);

      setNote("");
      setShowNote(false);
      await fetchTodayEntries();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setPunchingType(null);
    }
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Header with time */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Olá, {profile?.name || "Funcionário"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-3xl font-bold tabular-nums">{serverTime}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Punch buttons */}
      <div className="grid grid-cols-1 gap-3">
        {ALL_EVENT_TYPES.map((eventType) => {
          const isAllowed = allowedEvents.includes(eventType);
          const isPunching = punchingType === eventType;

          return (
            <Button
              key={eventType}
              className={`h-16 text-lg font-semibold ${
                isAllowed ? EVENT_COLORS[eventType] : ""
              }`}
              variant={isAllowed ? "default" : "outline"}
              disabled={!isAllowed || punchingType !== null}
              onClick={() => handlePunch(eventType)}
            >
              {isPunching ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <span className="mr-2">{EVENT_ICONS[eventType]}</span>
              )}
              {getEventLabel(eventType)}
            </Button>
          );
        })}
      </div>

      {/* Optional note */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowNote(!showNote)}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showNote ? "rotate-180" : ""}`}
          />
          Adicionar observação
        </button>
        {showNote && (
          <Input
            className="mt-2"
            placeholder="Observação opcional (max 200 caracteres)"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </div>

      {/* Today's entries */}
      {entries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registros de hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {EVENT_ICONS[entry.event_type]}
                    </span>
                    <span className="font-medium">
                      {getEventLabel(entry.event_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {entry.note && (
                      <span className="max-w-[100px] truncate text-xs italic">
                        {entry.note}
                      </span>
                    )}
                    <span className="font-mono">
                      {formatTime(entry.timestamp_server)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geolocation hint */}
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <MapPin className="h-3 w-3" />
        Localização capturada automaticamente (se permitido)
      </p>
    </main>
  );
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}
