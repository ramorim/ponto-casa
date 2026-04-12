"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Smartphone,
  Tablet,
  Monitor,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getCurrentDeviceId } from "@/services/devices";

interface Device {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  browser: string;
  last_active_at: string;
  created_at: string;
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function formatLastActive(iso: string): string {
  const now = Date.now();
  const ts = new Date(iso).getTime();
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d atrás`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export function DevicesCard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const currentDeviceId =
    typeof window !== "undefined" ? getCurrentDeviceId() : "";

  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data: Device[] = await res.json();
        setDevices(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  async function handleRemove(deviceId: string) {
    if (deviceId === currentDeviceId) {
      toast.error("Você não pode remover o dispositivo atual");
      return;
    }
    setRemovingId(deviceId);
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Erro ao remover dispositivo");
        return;
      }
      toast.success("Dispositivo desconectado");
      setDevices((prev) => prev.filter((d) => d.device_id !== deviceId));
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-base font-semibold text-gray-900">Dispositivos conectados</h2>
        <p className="text-sm text-gray-500 mt-1">
          Aparelhos onde sua conta está logada. Remova qualquer um que você não
          reconhece.
        </p>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))
        ) : devices.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum dispositivo registrado
          </p>
        ) : (
          devices.map((device) => {
            const isCurrent = device.device_id === currentDeviceId;
            return (
              <div
                key={device.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  isCurrent ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-muted-foreground">
                    <DeviceIcon type={device.device_type} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {device.device_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isCurrent ? (
                        <span className="text-primary inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Este dispositivo
                        </span>
                      ) : (
                        <>Ativo {formatLastActive(device.last_active_at)}</>
                      )}
                    </p>
                  </div>
                </div>
                {!isCurrent && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive shrink-0"
                    onClick={() => handleRemove(device.device_id)}
                    disabled={removingId === device.device_id}
                  >
                    {removingId === device.device_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
