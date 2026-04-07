import type { EventType } from "@/lib/time-entry-validation";

interface TimeEntry {
  event_type: EventType;
  timestamp_server: string;
}

interface WorkSchedule {
  start_time: string; // "08:00"
  lunch_start: string;
  lunch_end: string;
  end_time: string; // "17:00"
}

export interface DailyResult {
  date: string; // YYYY-MM-DD
  workedMinutes: number;
  overtimeMinutes: number;
  delayMinutes: number;
  isAbsent: boolean;
  isIncomplete: boolean;
}

export interface MonthSummary {
  totalHours: number;
  overtimeHours: number;
  delayMinutes: number;
  absenceDays: number;
  dailyResults: DailyResult[];
}

const DEFAULT_SCHEDULE: WorkSchedule = {
  start_time: "08:00",
  lunch_start: "12:00",
  lunch_end: "13:00",
  end_time: "17:00",
};

export function calculateDailyHours(
  entries: TimeEntry[],
  schedule: WorkSchedule = DEFAULT_SCHEDULE
): DailyResult {
  const date = entries.length > 0
    ? toSaoPauloDate(entries[0].timestamp_server)
    : "";

  const byType = new Map<EventType, string>();
  for (const entry of entries) {
    const time = toSaoPauloTime(entry.timestamp_server);
    byType.set(entry.event_type, time);
  }

  const entrada = byType.get("entrada");
  const saida = byType.get("saida");
  const saidaAlmoco = byType.get("saida_almoco");
  const voltaAlmoco = byType.get("volta_almoco");

  if (!entrada) {
    return {
      date,
      workedMinutes: 0,
      overtimeMinutes: 0,
      delayMinutes: 0,
      isAbsent: true,
      isIncomplete: false,
    };
  }

  if (!saida) {
    return {
      date,
      workedMinutes: 0,
      overtimeMinutes: 0,
      delayMinutes: 0,
      isAbsent: false,
      isIncomplete: true,
    };
  }

  const entradaMin = timeToMinutes(entrada);
  const saidaMin = timeToMinutes(saida);

  let workedMinutes = saidaMin - entradaMin;

  // Subtract lunch
  if (saidaAlmoco && voltaAlmoco) {
    workedMinutes -= timeToMinutes(voltaAlmoco) - timeToMinutes(saidaAlmoco);
  }

  if (workedMinutes < 0) workedMinutes = 0;

  // Expected work duration
  const scheduleStart = timeToMinutes(schedule.start_time);
  const scheduleEnd = timeToMinutes(schedule.end_time);
  const scheduleLunch = timeToMinutes(schedule.lunch_end) - timeToMinutes(schedule.lunch_start);
  const expectedMinutes = scheduleEnd - scheduleStart - scheduleLunch;

  // Delay: how late the employee arrived
  const delayMinutes = Math.max(0, entradaMin - scheduleStart);

  // Overtime: worked beyond expected
  const overtimeMinutes = Math.max(0, workedMinutes - expectedMinutes);

  return {
    date,
    workedMinutes,
    overtimeMinutes,
    delayMinutes,
    isAbsent: false,
    isIncomplete: false,
  };
}

export function calculateMonthSummary(
  entriesByDate: Map<string, TimeEntry[]>,
  workingDays: string[], // YYYY-MM-DD dates that are working days
  schedule: WorkSchedule = DEFAULT_SCHEDULE
): MonthSummary {
  const dailyResults: DailyResult[] = [];
  let totalWorkedMinutes = 0;
  let totalOvertimeMinutes = 0;
  let totalDelayMinutes = 0;
  let absenceDays = 0;

  for (const date of workingDays) {
    const dayEntries = entriesByDate.get(date) || [];

    if (dayEntries.length === 0) {
      dailyResults.push({
        date,
        workedMinutes: 0,
        overtimeMinutes: 0,
        delayMinutes: 0,
        isAbsent: true,
        isIncomplete: false,
      });
      absenceDays++;
      continue;
    }

    const result = calculateDailyHours(dayEntries, schedule);
    result.date = date;
    dailyResults.push(result);

    if (result.isAbsent) {
      absenceDays++;
    } else {
      totalWorkedMinutes += result.workedMinutes;
      totalOvertimeMinutes += result.overtimeMinutes;
      totalDelayMinutes += result.delayMinutes;
    }
  }

  return {
    totalHours: roundToDecimal(totalWorkedMinutes / 60, 2),
    overtimeHours: roundToDecimal(totalOvertimeMinutes / 60, 2),
    delayMinutes: totalDelayMinutes,
    absenceDays,
    dailyResults,
  };
}

export function getWorkingDays(month: string): string[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const days: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthNum - 1, day);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(`${month}-${String(day).padStart(2, "0")}`);
    }
  }

  return days;
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

function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
