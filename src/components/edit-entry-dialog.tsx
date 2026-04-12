"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getEventLabel } from "@/lib/time-entry-validation";
import type { EventType } from "@/lib/time-entry-validation";

interface EditEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  entry: {
    id: string;
    event_type: EventType;
    timestamp_server: string;
    note: string | null;
  };
}

export function EditEntryDialog({
  open,
  onClose,
  onSaved,
  entry,
}: EditEntryDialogProps) {
  const currentTime = toSaoPauloTimeInput(entry.timestamp_server);
  const currentDate = toSaoPauloDateInput(entry.timestamp_server);

  const [time, setTime] = useState(currentTime);
  const [note, setNote] = useState(entry.note || "");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave() {
    if (!reason.trim()) {
      toast.error("Informe o motivo da alteração");
      return;
    }

    setIsLoading(true);

    // Build new timestamp from edited time
    const newTimestamp = `${currentDate}T${time}:00-03:00`;
    const hasTimeChanged = time !== currentTime;
    const hasNoteChanged = note !== (entry.note || "");

    if (!hasTimeChanged && !hasNoteChanged) {
      toast.error("Nenhuma alteração feita");
      setIsLoading(false);
      return;
    }

    try {
      const body: Record<string, string> = { reason };
      if (hasTimeChanged) body.timestamp_server = new Date(newTimestamp).toISOString();
      if (hasNoteChanged) body.note = note;

      const res = await fetch(`/api/time-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        setIsLoading(false);
        return;
      }

      toast.success("Registro atualizado");
      onSaved();
      onClose();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Editar {getEventLabel(entry.event_type)}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {toSaoPauloDateLabel(entry.timestamp_server)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Horário atual</Label>
            <p className="text-sm text-gray-500 font-mono">{currentTime}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-time" className="text-gray-700">Novo horário</Label>
            <Input
              id="new-time"
              type="time"
              className="h-12 text-base"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-gray-700">Observação</Label>
            <Input
              id="note"
              className="h-12 text-base"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Observação opcional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-700">
              Motivo da alteração <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              className="text-base"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Funcionário esqueceu de bater ponto"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toSaoPauloTimeInput(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toSaoPauloDateInput(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

function toSaoPauloDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
