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
import { ALL_EVENT_TYPES, getEventLabel } from "@/lib/time-entry-validation";
import type { EventType } from "@/lib/time-entry-validation";

interface AddManualEntryDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeId: string;
  employeeName: string;
  defaultDate?: string; // YYYY-MM-DD
}

export function AddManualEntryDialog({
  open,
  onClose,
  onSaved,
  employeeId,
  employeeName,
  defaultDate,
}: AddManualEntryDialogProps) {
  const [eventType, setEventType] = useState<EventType>("entrada");
  const [date, setDate] = useState(defaultDate || todayDate());
  const [time, setTime] = useState("08:00");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave() {
    if (!reason.trim()) {
      toast.error("Informe o motivo do registro manual");
      return;
    }

    setIsLoading(true);

    const timestamp = new Date(`${date}T${time}:00-03:00`).toISOString();

    try {
      const res = await fetch("/api/time-entries/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          event_type: eventType,
          timestamp_server: timestamp,
          note: note.trim() || null,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar registro");
        setIsLoading(false);
        return;
      }

      toast.success("Registro manual criado");
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registro manual</DialogTitle>
          <DialogDescription>
            Criar ponto para {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENT_TYPES.map((et) => (
                <Button
                  key={et}
                  variant={eventType === et ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEventType(et)}
                  type="button"
                >
                  {getEventLabel(et)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-date">Data</Label>
              <Input
                id="manual-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-time">Horário</Label>
              <Input
                id="manual-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-note">Observação</Label>
            <Input
              id="manual-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-reason">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="manual-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Funcionário(a) esqueceu de bater ponto"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function todayDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}
