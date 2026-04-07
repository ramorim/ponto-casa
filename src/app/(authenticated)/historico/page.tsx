"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  History,
} from "lucide-react";
import type { EventType } from "@/lib/time-entry-validation";
import { EditEntryDialog } from "@/components/edit-entry-dialog";
import { AddManualEntryDialog } from "@/components/add-manual-entry-dialog";
import { AuditLog } from "@/components/audit-log";

interface TimeEntry {
  id: string;
  event_type: EventType;
  timestamp_server: string;
  note: string | null;
}

interface EntryRef {
  id: string;
  time: string;
  timestamp_server: string;
  note: string | null;
}

interface DayRow {
  date: string;
  dayLabel: string;
  isWeekend: boolean;
  entrada: EntryRef | null;
  saida_almoco: EntryRef | null;
  volta_almoco: EntryRef | null;
  saida: EntryRef | null;
  totalHours: string | null;
  isIncomplete: boolean;
}

interface EmployeeOption {
  id: string;
  name: string;
}

export default function HistoricoPage() {
  const { profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState<DayRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Edit state
  const [editingEntry, setEditingEntry] = useState<{
    id: string;
    event_type: EventType;
    timestamp_server: string;
    note: string | null;
  } | null>(null);

  // Manual entry state
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualDate, setManualDate] = useState<string | undefined>();

  // Audit state
  const [auditEntryId, setAuditEntryId] = useState<string | null>(null);

  const isEmployer = profile?.role === "employer";
  const canEdit = isEmployer && !!selectedEmployeeId;
  const supabase = createClient();

  useEffect(() => {
    if (!isEmployer || !profile) return;
    async function loadEmployees() {
      const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("employer_id", profile!.id)
        .eq("is_active", true);
      setEmployees(data || []);
    }
    loadEmployees();
  }, [isEmployer, profile, supabase]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ month: currentMonth });
      if (selectedEmployeeId) params.set("employee_id", selectedEmployeeId);

      const res = await fetch(`/api/time-entries/month?${params.toString()}`);
      if (!res.ok) throw new Error();
      const entries: TimeEntry[] = await res.json();
      setRows(buildDayRows(currentMonth, entries));
    } catch {
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, selectedEmployeeId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function navigateMonth(delta: number) {
    const [year, month] = currentMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function handleCellClick(ref: EntryRef | null, eventType: EventType, date: string) {
    if (!canEdit) return;
    if (ref) {
      setEditingEntry({
        id: ref.id,
        event_type: eventType,
        timestamp_server: ref.timestamp_server,
        note: ref.note,
      });
    } else {
      setManualDate(date);
      setShowManualDialog(true);
    }
  }

  function toggleAudit(entryId: string) {
    setAuditEntryId(auditEntryId === entryId ? null : entryId);
  }

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold capitalize">
          {formatMonthLabel(currentMonth)}
        </h1>
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Employee selector + manual entry button */}
      {isEmployer && employees.length > 0 && (
        <div className="flex gap-2">
          <select
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            value={selectedEmployeeId || ""}
            onChange={(e) => setSelectedEmployeeId(e.target.value || null)}
          >
            <option value="">Meus registros</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setManualDate(undefined);
                setShowManualDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Manual
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Nenhum registro neste mês
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">Data</th>
                        <th className="px-3 py-2 text-center font-medium">Entrada</th>
                        <th className="px-3 py-2 text-center font-medium">Almoço</th>
                        <th className="px-3 py-2 text-center font-medium">Retorno</th>
                        <th className="px-3 py-2 text-center font-medium">Saída</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                        {canEdit && <th className="px-1 py-2 w-8" />}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.date}
                          row={row}
                          canEdit={canEdit}
                          onCellClick={handleCellClick}
                          auditEntryId={auditEntryId}
                          onToggleAudit={toggleAudit}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {rows.map((row) => {
              const hasEntries = row.entrada || row.saida_almoco || row.volta_almoco || row.saida;
              if (!hasEntries && row.isWeekend) return null;

              return (
                <Card
                  key={row.date}
                  className={`${row.isWeekend ? "opacity-60" : ""} ${
                    row.isIncomplete ? "border-amber-300" : ""
                  }`}
                >
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs font-mono text-muted-foreground flex items-center">
                      <span>{row.dayLabel}</span>
                      {row.totalHours && (
                        <span className="ml-auto font-semibold text-foreground">
                          {row.totalHours}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      {(["entrada", "saida_almoco", "volta_almoco", "saida"] as const).map(
                        (type) => {
                          const ref = row[type];
                          const labels = {
                            entrada: "Entrada",
                            saida_almoco: "Almoço",
                            volta_almoco: "Retorno",
                            saida: "Saída",
                          };
                          return (
                            <div
                              key={type}
                              className={canEdit ? "cursor-pointer hover:bg-muted/50 rounded p-1" : "p-1"}
                              onClick={() => canEdit && handleCellClick(ref, type, row.date)}
                            >
                              <p className="text-muted-foreground">{labels[type]}</p>
                              <p className="font-mono font-medium">{ref?.time || "—"}</p>
                            </div>
                          );
                        }
                      )}
                    </div>
                    {/* Audit for any entry in this day */}
                    {(["entrada", "saida_almoco", "volta_almoco", "saida"] as const).map((type) => {
                      const ref = row[type];
                      if (!ref) return null;
                      return (
                        <div key={`audit-${type}`}>
                          {auditEntryId === ref.id && (
                            <AuditLog entryId={ref.id} open={true} />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Edit dialog */}
      {editingEntry && (
        <EditEntryDialog
          open={true}
          onClose={() => setEditingEntry(null)}
          onSaved={fetchEntries}
          entry={editingEntry}
        />
      )}

      {/* Manual entry dialog */}
      {showManualDialog && selectedEmployeeId && selectedEmployee && (
        <AddManualEntryDialog
          open={true}
          onClose={() => setShowManualDialog(false)}
          onSaved={fetchEntries}
          employeeId={selectedEmployeeId}
          employeeName={selectedEmployee.name}
          defaultDate={manualDate}
        />
      )}
    </main>
  );
}

// ── Table Row Component ──

function TableRow({
  row,
  canEdit,
  onCellClick,
  auditEntryId,
  onToggleAudit,
}: {
  row: DayRow;
  canEdit: boolean;
  onCellClick: (ref: EntryRef | null, eventType: EventType, date: string) => void;
  auditEntryId: string | null;
  onToggleAudit: (id: string) => void;
}) {
  const types = ["entrada", "saida_almoco", "volta_almoco", "saida"] as const;
  const hasAnyEntry = types.some((t) => row[t]);

  return (
    <>
      <tr
        className={`border-b ${
          row.isWeekend ? "bg-muted/30 text-muted-foreground" : ""
        } ${row.isIncomplete ? "bg-amber-50" : ""}`}
      >
        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{row.dayLabel}</td>
        {types.map((type) => {
          const ref = row[type];
          return (
            <td
              key={type}
              className={`px-3 py-2 text-center font-mono text-xs ${
                canEdit ? "cursor-pointer hover:bg-muted/50" : ""
              }`}
              onClick={() => canEdit && onCellClick(ref, type, row.date)}
            >
              {ref?.time || "—"}
              {canEdit && ref && (
                <Pencil className="inline ml-1 h-3 w-3 text-muted-foreground" />
              )}
            </td>
          );
        })}
        <td className="px-3 py-2 text-right font-mono text-xs">{row.totalHours || "—"}</td>
        {canEdit && (
          <td className="px-1 py-2">
            {hasAnyEntry && (
              <button
                className="p-1 hover:bg-muted rounded"
                onClick={() => {
                  const firstEntry = types.map((t) => row[t]).find(Boolean);
                  if (firstEntry) onToggleAudit(firstEntry.id);
                }}
              >
                <History className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </td>
        )}
      </tr>
      {/* Inline audit */}
      {types.map((type) => {
        const ref = row[type];
        if (!ref || auditEntryId !== ref.id) return null;
        return (
          <tr key={`audit-${type}`}>
            <td colSpan={canEdit ? 7 : 6} className="px-3 py-2 bg-muted/20">
              <AuditLog entryId={ref.id} open={true} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ── Helpers ──

function buildDayRows(month: string, entries: TimeEntry[]): DayRow[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const byDate = new Map<string, Map<EventType, { id: string; time: string; timestamp_server: string; note: string | null }>>();
  for (const entry of entries) {
    const spDate = toSaoPauloDate(entry.timestamp_server);
    const spTime = toSaoPauloTime(entry.timestamp_server);
    if (!byDate.has(spDate)) byDate.set(spDate, new Map());
    byDate.get(spDate)!.set(entry.event_type, {
      id: entry.id,
      time: spTime,
      timestamp_server: entry.timestamp_server,
      note: entry.note,
    });
  }

  const rows: DayRow[] = [];
  const weekdays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const d = new Date(year, monthNum - 1, day);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dayEntries = byDate.get(dateStr);
    const entrada = dayEntries?.get("entrada") ?? null;
    const saida_almoco = dayEntries?.get("saida_almoco") ?? null;
    const volta_almoco = dayEntries?.get("volta_almoco") ?? null;
    const saida = dayEntries?.get("saida") ?? null;

    const hasAnyEntry = !!(entrada || saida_almoco || volta_almoco || saida);
    const isIncomplete = hasAnyEntry && !saida;

    let totalHours: string | null = null;
    if (entrada && saida) {
      totalHours = calculateDayTotal(entrada.time, saida_almoco?.time ?? null, volta_almoco?.time ?? null, saida.time);
    }

    rows.push({
      date: dateStr,
      dayLabel: `${String(day).padStart(2, "0")}/${String(monthNum).padStart(2, "0")} ${weekdays[dayOfWeek]}`,
      isWeekend,
      entrada,
      saida_almoco,
      volta_almoco,
      saida,
      totalHours,
      isIncomplete,
    });
  }

  return rows;
}

function calculateDayTotal(
  entrada: string,
  saida_almoco: string | null,
  volta_almoco: string | null,
  saida: string
): string {
  const entradaMin = timeToMinutes(entrada);
  const saidaMin = timeToMinutes(saida);
  let workedMinutes = saidaMin - entradaMin;

  if (saida_almoco && volta_almoco) {
    workedMinutes -= timeToMinutes(volta_almoco) - timeToMinutes(saida_almoco);
  }

  if (workedMinutes < 0) workedMinutes = 0;
  const hours = Math.floor(workedMinutes / 60);
  const mins = workedMinutes % 60;
  return `${hours}h${mins > 0 ? String(mins).padStart(2, "0") : "00"}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toSaoPauloDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function toSaoPauloTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const d = new Date(year, monthNum - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
