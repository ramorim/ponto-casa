"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";

interface AuditEntry {
  id: string;
  field_changed: string;
  previous_value: string | null;
  new_value: string | null;
  changed_by_name: string;
  reason: string;
  changed_at: string;
}

const FIELD_LABELS: Record<string, string> = {
  timestamp_server: "Horário",
  note: "Observação",
  event_type: "Tipo",
  created_manually: "Criado manualmente",
};

interface AuditLogProps {
  entryId: string;
  open: boolean;
}

export function AuditLog({ entryId, open }: AuditLogProps) {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;

    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/time-entries/${entryId}/audit`);
        if (res.ok) {
          setAudits(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
        setLoaded(true);
      }
    }
    load();
  }, [entryId, open, loaded]);

  if (!open) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        Nenhuma alteração registrada
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-1">
      {audits.map((audit) => (
        <div
          key={audit.id}
          className="rounded border bg-muted/30 p-2 text-xs space-y-1"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <History className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="text-[10px]">
              {FIELD_LABELS[audit.field_changed] || audit.field_changed}
            </Badge>
            <span className="text-muted-foreground">por {audit.changed_by_name}</span>
            <span className="text-muted-foreground ml-auto">
              {formatDateTime(audit.changed_at)}
            </span>
          </div>
          {audit.field_changed !== "created_manually" && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="line-through">{formatValue(audit.field_changed, audit.previous_value)}</span>
              <span>→</span>
              <span className="font-medium text-foreground">
                {formatValue(audit.field_changed, audit.new_value)}
              </span>
            </div>
          )}
          <p className="italic text-muted-foreground">{audit.reason}</p>
        </div>
      ))}
    </div>
  );
}

function formatValue(field: string, value: string | null): string {
  if (!value) return "—";
  if (field === "timestamp_server" || field === "created_manually") {
    try {
      return new Date(value).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  }
  return value;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
