"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PunchSkeleton } from "@/components/skeletons";

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
  const router = useRouter();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [allowedEvents, setAllowedEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [punchingType, setPunchingType] = useState<EventType | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [serverTime, setServerTime] = useState<string>("");
  const [capturingLocation, setCapturingLocation] = useState(false);

  // Geolocation permission state. We do NOT cache coordinates client-side —
  // every punch captures fresh in real time to prevent tampering.
  const [permissionState, setPermissionState] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  // Probe permission state on mount and keep it updated.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      setPermissionState("unknown");
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        permissionStatus = status;
        setPermissionState(status.state as typeof permissionState);
        status.onchange = () => {
          setPermissionState(status.state as typeof permissionState);
        };
      })
      .catch(() => {
        if (!cancelled) setPermissionState("unknown");
      });

    return () => {
      cancelled = true;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  // Warm up the GPS so the first real-time capture is fast. The watcher
  // does NOT store coordinates anywhere — it only keeps the GPS chip warm.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      () => {},
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /**
   * Captures coordinates in real time. Returns null if the user has denied
   * permission. Throws if permission is granted but capture fails (callers
   * should treat this as an error and abort the punch).
   */
  async function captureCoords(): Promise<{ lat: number; lng: number } | null> {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return null;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          // PERMISSION_DENIED → return null (allowed to punch without coords)
          if (err.code === err.PERMISSION_DENIED) {
            resolve(null);
            return;
          }
          // POSITION_UNAVAILABLE / TIMEOUT → reject so caller can abort
          reject(err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 25000,
        }
      );
    });
  }

  // Employers don't punch — redirect to employees page
  useEffect(() => {
    if (profile && profile.role === "employer") {
      router.replace("/funcionarios");
    }
  }, [profile, router]);

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
    setCapturingLocation(true);

    let latitude: number | undefined;
    let longitude: number | undefined;

    // Capture coordinates in real time. If permission was granted but capture
    // fails (timeout, GPS unavailable), abort the punch — we don't want to
    // accept a punch with missing coords when the user agreed to share them.
    try {
      const coords = await captureCoords();
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      } else if (permissionState === "granted") {
        // Permission says granted but we got null (shouldn't happen) → abort
        toast.error("Não foi possível obter a localização. Tente novamente.");
        setCapturingLocation(false);
        setPunchingType(null);
        return;
      }
    } catch (err) {
      console.warn("Geolocation capture failed:", err);
      // Permission was granted but the capture failed → block the punch
      if (permissionState !== "denied") {
        toast.error(
          "Falha ao capturar localização. Verifique sua conexão GPS e tente novamente."
        );
        setCapturingLocation(false);
        setPunchingType(null);
        return;
      }
      // permission is "denied" → proceed without coords
    } finally {
      setCapturingLocation(false);
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
    return <PunchSkeleton />;
  }

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Header with time */}
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-500">
          Olá, {profile?.name || "Funcionário"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-3xl font-bold tabular-nums text-gray-900">{serverTime}</span>
        </div>
        <p className="text-sm text-gray-500">
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
              className={`h-16 text-lg font-semibold rounded-2xl ${
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
              {isPunching && capturingLocation
                ? "Capturando localização..."
                : getEventLabel(eventType)}
            </Button>
          );
        })}
      </div>

      {/* Optional note */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-foreground transition-colors"
          onClick={() => setShowNote(!showNote)}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showNote ? "rotate-180" : ""}`}
          />
          Adicionar observação
        </button>
        {showNote && (
          <Input
            className="mt-2 h-12 text-base"
            placeholder="Observação opcional (max 200 caracteres)"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </div>

      {/* Today's entries */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-base font-semibold text-gray-900">
              Registros de hoje
            </h2>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {EVENT_ICONS[entry.event_type]}
                    </span>
                    <span className="font-medium text-gray-900">
                      {getEventLabel(entry.event_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
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
          </div>
        </div>
      )}

      {/* Geolocation hint */}
      <p
        className={`text-center text-xs flex items-center justify-center gap-1 ${
          permissionState === "granted"
            ? "text-green-700"
            : permissionState === "denied"
            ? "text-amber-700"
            : "text-gray-500"
        }`}
      >
        <MapPin className="h-3 w-3" />
        {permissionState === "granted"
          ? "Localização será capturada em tempo real"
          : permissionState === "denied"
          ? "Localização bloqueada — pontos sem GPS"
          : "Toque em um botão para permitir localização"}
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
