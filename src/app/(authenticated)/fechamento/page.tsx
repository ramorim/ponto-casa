"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  RefreshCw,
  Lock,
  Unlock,
  Clock,
  AlertTriangle,
  CalendarOff,
  Timer,
  FileDown,
} from "lucide-react";
import { ClosingSkeleton } from "@/components/skeletons";

interface Closing {
  id: string;
  employee_id: string;
  month_ref: string;
  total_hours: number | null;
  overtime_hours: number | null;
  delay_minutes: number | null;
  absence_days: number | null;
  notes: string | null;
  employee_accepted: boolean;
  accepted_at: string | null;
}

interface EmployeeOption {
  id: string;
  name: string;
}

export default function FechamentoPage() {
  const { profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [closing, setClosing] = useState<Closing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Reopen dialog
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isReopening, setIsReopening] = useState(false);

  // Employer: employee selector
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const isEmployer = profile?.role === "employer";
  const isEmployee = profile?.role === "employee";
  useEffect(() => {
    if (!isEmployer) return;
    async function loadEmployees() {
      const res = await fetch("/api/employees");
      if (res.ok) setEmployees(await res.json());
    }
    loadEmployees();
  }, [isEmployer]);

  const targetEmployeeId = isEmployer ? selectedEmployeeId : profile?.id;

  const fetchClosing = useCallback(async () => {
    if (!targetEmployeeId) {
      setClosing(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ month: currentMonth });
      if (isEmployer && targetEmployeeId) {
        params.set("employee_id", targetEmployeeId);
      }
      const res = await fetch(`/api/closings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClosing(data as Closing | null);
      } else {
        setClosing(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, targetEmployeeId, isEmployer]);

  useEffect(() => {
    fetchClosing();
  }, [fetchClosing]);

  function navigateMonth(delta: number) {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  async function handleGenerate() {
    if (!targetEmployeeId) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/closings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: targetEmployeeId,
          month_ref: currentMonth,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao gerar fechamento");
      } else {
        toast.success("Fechamento gerado");
        await fetchClosing();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleAccept() {
    if (!closing) return;
    setIsAccepting(true);

    try {
      const res = await fetch(`/api/closings/${closing.id}/accept`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao aceitar");
      } else {
        toast.success("Fechamento aceito!");
        await fetchClosing();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleReopen() {
    if (!closing || !reopenReason.trim()) {
      toast.error("Informe o motivo");
      return;
    }
    setIsReopening(true);

    try {
      const res = await fetch(`/api/closings/${closing.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reopenReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao reabrir");
      } else {
        toast.success("Mês reaberto");
        setShowReopenDialog(false);
        setReopenReason("");
        await fetchClosing();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsReopening(false);
    }
  }

  async function handleDownloadPdf() {
    if (!closing) return;
    setIsDownloadingPdf(true);

    try {
      const res = await fetch(`/api/closings/${closing.id}/pdf`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao gerar PDF");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `espelho-ponto-${closing.month_ref}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const monthLabel = formatMonthLabel(currentMonth);

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full bg-gray-50 min-h-full">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900 capitalize">{monthLabel}</h1>
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Employee selector (employer) */}
      {isEmployer && employees.length > 0 && (
        <select
          className="w-full rounded-lg border bg-white px-3 py-2 h-12 text-base"
          value={selectedEmployeeId || ""}
          onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
        >
          <option value="">Selecione um funcionário</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      )}

      {isLoading ? (
        <ClosingSkeleton />
      ) : !targetEmployeeId ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Selecione um funcionário para ver o fechamento
        </p>
      ) : !closing ? (
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="py-8 text-center space-y-4">
            <p className="text-gray-500">
              Nenhum fechamento gerado para este mês
            </p>
            {isEmployer && (
              <Button className="bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Gerar fechamento
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Status badge */}
          <div className="flex justify-center">
            {closing.employee_accepted ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <Lock className="mr-1 h-3 w-3" />
                Aceito em{" "}
                {closing.accepted_at
                  ? new Date(closing.accepted_at).toLocaleDateString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })
                  : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                <Unlock className="mr-1 h-3 w-3" />
                Pendente de aceite
              </Badge>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="pt-4 pb-3 text-center">
                <Clock className="mx-auto h-5 w-5 text-gray-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900">
                  {closing.total_hours?.toFixed(1) ?? "—"}h
                </p>
                <p className="text-xs text-gray-500">Total trabalhado</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="pt-4 pb-3 text-center">
                <Timer className="mx-auto h-5 w-5 text-gray-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900">
                  {closing.overtime_hours?.toFixed(1) ?? "0"}h
                </p>
                <p className="text-xs text-gray-500">Horas extras</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="pt-4 pb-3 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-gray-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900">
                  {closing.delay_minutes ?? 0}min
                </p>
                <p className="text-xs text-gray-500">Atrasos</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="pt-4 pb-3 text-center">
                <CalendarOff className="mx-auto h-5 w-5 text-gray-500 mb-1" />
                <p className="text-2xl font-bold text-gray-900">
                  {closing.absence_days ?? 0}
                </p>
                <p className="text-xs text-gray-500">Faltas</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {closing.notes && (
            <div className="bg-white rounded-2xl shadow-sm border">
              <div className="p-4">
                <p className="text-sm text-gray-500">{closing.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {/* Employer: recalculate */}
            {isEmployer && !closing.employee_accepted && (
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Recalcular
              </Button>
            )}

            {/* Employee: accept */}
            {isEmployee && !closing.employee_accepted && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-700">
                <div className="px-4 pt-4 pb-2">
                  <h2 className="text-base font-semibold text-gray-900">Aceite do fechamento</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Ao aceitar, você confirma que os horários correspondem à sua
                    jornada neste mês.
                  </p>
                </div>
                <div className="px-4 pb-4">
                  <Button
                    className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold"
                    onClick={handleAccept}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Confirmo que os horários estão corretos
                  </Button>
                </div>
              </div>
            )}

            {/* Export PDF */}
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Exportar PDF
            </Button>

            {/* Employer: reopen */}
            {isEmployer && closing.employee_accepted && (
              <Button
                variant="outline"
                className="w-full h-11 text-amber-700"
                onClick={() => setShowReopenDialog(true)}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Reabrir mês
              </Button>
            )}
          </div>
        </>
      )}

      {/* Reopen dialog */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reabrir mês</DialogTitle>
            <DialogDescription>
              O aceite do(a) funcionário(a) será removido e os registros poderão
              ser editados novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reopen-reason">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reopen-reason"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Ex: Correção de horário identificada após aceite"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReopenDialog(false)}
              disabled={isReopening}
            >
              Cancelar
            </Button>
            <Button onClick={handleReopen} disabled={isReopening}>
              {isReopening ? "Reabrindo..." : "Reabrir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const d = new Date(year, monthNum - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
