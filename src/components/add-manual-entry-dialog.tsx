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
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Registro manual</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Criar ponto para {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENT_TYPES.map((et) => (
                <Button
                  key={et}
                  variant={eventType === et ? "default" : "outline"}
                  size="sm"
                  className={`h-10 text-sm ${eventType === et ? "bg-blue-700 hover:bg-blue-800" : ""}`}
                  onClick={() => setEventType(et)}
                  type="button"
                >
                  {getEventLabel(et)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-date" className="text-gray-700">Data</Label>
            <Input
              id="manual-date"
              type="date"
              className="h-12 text-base w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-time" className="text-gray-700">Horário</Label>
            <Input
              id="manual-time"
              type="time"
              className="h-12 text-base w-full"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-note" className="text-gray-700">Observação</Label>
            <Input
              id="manual-note"
              className="h-12 text-base"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Opcional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-reason" className="text-gray-700">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="manual-reason"
              className="text-base"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Funcionário(a) esqueceu de bater ponto"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar registro"}
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={onClose} disabled={isLoading}>
            Cancelar
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
