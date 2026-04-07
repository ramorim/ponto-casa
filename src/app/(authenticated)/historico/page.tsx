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
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { EventType } from "@/lib/time-entry-validation";

interface TimeEntry {
  id: string;
  event_type: EventType;
  timestamp_server: string;
  note: string | null;
}

interface DayRow {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "01/04 seg"
  isWeekend: boolean;
  entrada: string | null;
  saida_almoco: string | null;
  volta_almoco: string | null;
  saida: string | null;
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

  const isEmployer = profile?.role === "employer";
  const supabase = createClient();

  // Load employees for employer dropdown
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
      if (selectedEmployeeId) {
        params.set("employee_id", selectedEmployeeId);
      }

      const res = await fetch(`/api/time-entries/month?${params.toString()}`);
      if (!res.ok) throw new Error();
      const entries: TimeEntry[] = await res.json();

      const dayRows = buildDayRows(currentMonth, entries);
      setRows(dayRows);
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
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  const monthLabel = formatMonthLabel(currentMonth);

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold capitalize">{monthLabel}</h1>
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Employee selector (employer only) */}
      {isEmployer && employees.length > 0 && (
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.date}
                          className={`border-b ${
                            row.isWeekend ? "bg-muted/30 text-muted-foreground" : ""
                          } ${row.isIncomplete ? "bg-amber-50" : ""}`}
                        >
                          <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                            {row.dayLabel}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-xs">
                            {row.entrada || "—"}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-xs">
                            {row.saida_almoco || "—"}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-xs">
                            {row.volta_almoco || "—"}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-xs">
                            {row.saida || "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            {row.totalHours || "—"}
                          </td>
                        </tr>
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
                    <CardTitle className="text-xs font-mono text-muted-foreground">
                      {row.dayLabel}
                      {row.totalHours && (
                        <span className="float-right font-semibold text-foreground">
                          {row.totalHours}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      <div>
                        <p className="text-muted-foreground">Entrada</p>
                        <p className="font-mono font-medium">{row.entrada || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Almoço</p>
                        <p className="font-mono font-medium">{row.saida_almoco || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retorno</p>
                        <p className="font-mono font-medium">{row.volta_almoco || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Saída</p>
                        <p className="font-mono font-medium">{row.saida || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

// ── Helpers ──

function buildDayRows(month: string, entries: TimeEntry[]): DayRow[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Group entries by São Paulo date
  const byDate = new Map<string, Map<EventType, string>>();
  for (const entry of entries) {
    const spDate = toSaoPauloDate(entry.timestamp_server);
    const spTime = toSaoPauloTime(entry.timestamp_server);
    if (!byDate.has(spDate)) byDate.set(spDate, new Map());
    byDate.get(spDate)!.set(entry.event_type, spTime);
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
      totalHours = calculateDayTotal(entrada, saida_almoco, volta_almoco, saida);
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

  // Subtract lunch if both lunch out and lunch return exist
  if (saida_almoco && volta_almoco) {
    const lunchOut = timeToMinutes(saida_almoco);
    const lunchReturn = timeToMinutes(volta_almoco);
    workedMinutes -= lunchReturn - lunchOut;
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
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
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
