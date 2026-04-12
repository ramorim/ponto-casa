"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WorkScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

export function WorkScheduleDialog({
  open,
  onClose,
  employeeId,
  employeeName,
}: WorkScheduleDialogProps) {
  const [startTime, setStartTime] = useState("08:00");
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("13:00");
  const [endTime, setEndTime] = useState("17:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);

    async function loadSchedule() {
      try {
        const res = await fetch(
          `/api/work-schedules?employee_id=${employeeId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setStartTime(data.start_time?.slice(0, 5) || "08:00");
            setLunchStart(data.lunch_start?.slice(0, 5) || "12:00");
            setLunchEnd(data.lunch_end?.slice(0, 5) || "13:00");
            setEndTime(data.end_time?.slice(0, 5) || "17:00");
          }
        }
      } catch {
        // Keep defaults
      } finally {
        setIsLoading(false);
      }
    }
    loadSchedule();
  }, [open, employeeId]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/work-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          start_time: startTime,
          lunch_start: lunchStart,
          lunch_end: lunchEnd,
          end_time: endTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      toast.success("Horário de trabalho atualizado");
      onClose();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Horário de trabalho</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Definir jornada de {employeeName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="start" className="text-gray-700">Entrada</Label>
                <Input
                  id="start"
                  type="time"
                  className="h-12 text-base"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end" className="text-gray-700">Saída</Label>
                <Input
                  id="end"
                  type="time"
                  className="h-12 text-base"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-0">
              <div className="space-y-2">
                <Label htmlFor="lunch-start" className="text-gray-700">Início almoço</Label>
                <Input
                  id="lunch-start"
                  type="time"
                  className="h-12 text-base"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch-end" className="text-gray-700">Fim almoço</Label>
                <Input
                  id="lunch-end"
                  type="time"
                  className="h-12 text-base"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Jornada:{" "}
              <strong className="text-gray-900">
                {calculateWorkHours(startTime, lunchStart, lunchEnd, endTime)}
              </strong>{" "}
              por dia (descontando almoço)
            </p>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold" onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function calculateWorkHours(
  start: string,
  lunchStart: string,
  lunchEnd: string,
  end: string
): string {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const total = toMin(end) - toMin(start);
  const lunch = toMin(lunchEnd) - toMin(lunchStart);
  const worked = total - lunch;
  if (worked <= 0) return "0h";
  const h = Math.floor(worked / 60);
  const m = worked % 60;
  return `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
}
