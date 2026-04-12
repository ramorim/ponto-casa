import { describe, it, expect } from "vitest";
import {
  calculateDailyHours,
  calculateMonthSummary,
  getWorkingDays,
} from "../hours";

// Helper: create a time entry with a São Paulo-based ISO timestamp
function entry(
  eventType: "entrada" | "saida_almoco" | "volta_almoco" | "saida",
  time: string, // HH:mm
  date = "2026-04-07"
) {
  // Create timestamp at São Paulo time (UTC-3)
  return {
    event_type: eventType,
    timestamp_server: `${date}T${time}:00-03:00`,
  };
}

const DEFAULT_SCHEDULE = {
  start_time: "08:00",
  lunch_start: "12:00",
  lunch_end: "13:00",
  end_time: "17:00",
};

// ── calculateDailyHours ──

describe("calculateDailyHours", () => {
  it("dia normal completo (8h-12h, 13h-17h) = 8h trabalhadas, 0 extras, 0 atraso", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:00"),
      entry("saida_almoco", "12:00"),
      entry("volta_almoco", "13:00"),
      entry("saida", "17:00"),
    ]);

    expect(result.workedMinutes).toBe(480); // 8h
    expect(result.overtimeMinutes).toBe(0);
    expect(result.delayMinutes).toBe(0);
    expect(result.isAbsent).toBe(false);
    expect(result.isIncomplete).toBe(false);
  });

  it("dia com hora extra (8h-12h, 13h-19h) = 10h trabalhadas, 2h extras", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:00"),
      entry("saida_almoco", "12:00"),
      entry("volta_almoco", "13:00"),
      entry("saida", "19:00"),
    ]);

    expect(result.workedMinutes).toBe(600); // 10h
    expect(result.overtimeMinutes).toBe(120); // 2h extras
    expect(result.delayMinutes).toBe(0);
  });

  it("dia com atraso (8:30 entrada) = 30 min de atraso", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:30"),
      entry("saida_almoco", "12:00"),
      entry("volta_almoco", "13:00"),
      entry("saida", "17:00"),
    ]);

    expect(result.delayMinutes).toBe(30);
    expect(result.workedMinutes).toBe(450); // 7h30
    expect(result.overtimeMinutes).toBe(0);
  });

  it("saída antecipada (saída 16:00) = 7h trabalhadas, 0 extras", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:00"),
      entry("saida_almoco", "12:00"),
      entry("volta_almoco", "13:00"),
      entry("saida", "16:00"),
    ]);

    expect(result.workedMinutes).toBe(420); // 7h
    expect(result.overtimeMinutes).toBe(0);
    expect(result.delayMinutes).toBe(0);
  });

  it("dia sem almoço registrado (entrada 8h, saída 17h) = 9h trabalhadas (sem desconto)", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:00"),
      entry("saida", "17:00"),
    ]);

    expect(result.workedMinutes).toBe(540); // 9h (sem desconto de almoço)
    expect(result.overtimeMinutes).toBe(60); // 1h extra (9h - 8h esperado)
  });

  it("falta (sem entradas) = ausente", () => {
    const result = calculateDailyHours([]);

    expect(result.isAbsent).toBe(true);
    expect(result.workedMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.delayMinutes).toBe(0);
  });

  it("dia parcial (só entrada, sem saída) = incompleto", () => {
    const result = calculateDailyHours([entry("entrada", "08:00")]);

    expect(result.isIncomplete).toBe(true);
    expect(result.isAbsent).toBe(false);
    expect(result.workedMinutes).toBe(0);
  });

  it("entrada + saída almoço sem retorno nem saída = incompleto", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:00"),
      entry("saida_almoco", "12:00"),
    ]);

    expect(result.isIncomplete).toBe(true);
    expect(result.workedMinutes).toBe(0);
  });

  it("atraso + hora extra se compensam (chegou 30min atrasado, saiu 30min tarde)", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:30"),
      entry("saida_almoco", "12:00"),
      entry("volta_almoco", "13:00"),
      entry("saida", "17:30"),
    ]);

    expect(result.delayMinutes).toBe(30);
    expect(result.workedMinutes).toBe(480); // 8h
    expect(result.overtimeMinutes).toBe(0); // não tem extra (8h = esperado)
  });

  it("schedule customizado (9h-18h, almoço 12h-13h) = 8h esperadas", () => {
    const customSchedule = {
      start_time: "09:00",
      lunch_start: "12:00",
      lunch_end: "13:00",
      end_time: "18:00",
    };

    const result = calculateDailyHours(
      [
        entry("entrada", "09:00"),
        entry("saida_almoco", "12:00"),
        entry("volta_almoco", "13:00"),
        entry("saida", "18:00"),
      ],
      customSchedule
    );

    expect(result.workedMinutes).toBe(480);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.delayMinutes).toBe(0);
  });

  it("almoço mais longo que o padrão (12h-14h) desconta 2h", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:00"),
      entry("saida_almoco", "12:00"),
      entry("volta_almoco", "14:00"),
      entry("saida", "17:00"),
    ]);

    expect(result.workedMinutes).toBe(420); // 7h (9h total - 2h almoço)
  });

  it("minutos quebrados (8:03 - 17:04, almoço 12:01 - 13:02)", () => {
    const result = calculateDailyHours([
      entry("entrada", "08:03"),
      entry("saida_almoco", "12:01"),
      entry("volta_almoco", "13:02"),
      entry("saida", "17:04"),
    ]);

    // 17:04 - 08:03 = 541 min, almoço 13:02-12:01 = 61 min → 480 min = 8h
    expect(result.workedMinutes).toBe(480);
    expect(result.delayMinutes).toBe(3);
  });
});

// ── getWorkingDays ──

describe("getWorkingDays", () => {
  it("abril 2026 tem 22 dias úteis", () => {
    const days = getWorkingDays("2026-04");
    expect(days.length).toBe(22);
  });

  it("não inclui sábados e domingos", () => {
    const days = getWorkingDays("2026-04");
    for (const day of days) {
      const d = new Date(day + "T12:00:00");
      const dow = d.getDay();
      expect(dow).not.toBe(0); // domingo
      expect(dow).not.toBe(6); // sábado
    }
  });

  it("fevereiro 2026 (não bissexto) tem 20 dias úteis", () => {
    const days = getWorkingDays("2026-02");
    expect(days.length).toBe(20);
  });

  it("retorna datas no formato YYYY-MM-DD", () => {
    const days = getWorkingDays("2026-04");
    expect(days[0]).toBe("2026-04-01");
    expect(days[days.length - 1]).toBe("2026-04-30");
  });
});

// ── calculateMonthSummary ──

describe("calculateMonthSummary", () => {
  it("mês com 1 dia trabalhado normal + resto falta", () => {
    const workingDays = ["2026-04-01", "2026-04-02", "2026-04-03"];
    const entriesByDate = new Map();

    // Só dia 1 tem entries
    entriesByDate.set("2026-04-01", [
      entry("entrada", "08:00", "2026-04-01"),
      entry("saida_almoco", "12:00", "2026-04-01"),
      entry("volta_almoco", "13:00", "2026-04-01"),
      entry("saida", "17:00", "2026-04-01"),
    ]);

    const summary = calculateMonthSummary(entriesByDate, workingDays);

    expect(summary.totalHours).toBe(8);
    expect(summary.overtimeHours).toBe(0);
    expect(summary.delayMinutes).toBe(0);
    expect(summary.absenceDays).toBe(2);
    expect(summary.dailyResults.length).toBe(3);
  });

  it("mês com extras acumula corretamente", () => {
    const workingDays = ["2026-04-01", "2026-04-02"];
    const entriesByDate = new Map();

    // Dia 1: 2h extra
    entriesByDate.set("2026-04-01", [
      entry("entrada", "08:00", "2026-04-01"),
      entry("saida_almoco", "12:00", "2026-04-01"),
      entry("volta_almoco", "13:00", "2026-04-01"),
      entry("saida", "19:00", "2026-04-01"),
    ]);

    // Dia 2: 1h extra
    entriesByDate.set("2026-04-02", [
      entry("entrada", "08:00", "2026-04-02"),
      entry("saida_almoco", "12:00", "2026-04-02"),
      entry("volta_almoco", "13:00", "2026-04-02"),
      entry("saida", "18:00", "2026-04-02"),
    ]);

    const summary = calculateMonthSummary(entriesByDate, workingDays);

    expect(summary.totalHours).toBe(19); // 10h + 9h
    expect(summary.overtimeHours).toBe(3); // 2h + 1h
    expect(summary.absenceDays).toBe(0);
  });

  it("mês com atrasos acumula minutos", () => {
    const workingDays = ["2026-04-01", "2026-04-02"];
    const entriesByDate = new Map();

    entriesByDate.set("2026-04-01", [
      entry("entrada", "08:15", "2026-04-01"),
      entry("saida", "17:00", "2026-04-01"),
    ]);

    entriesByDate.set("2026-04-02", [
      entry("entrada", "08:30", "2026-04-02"),
      entry("saida", "17:00", "2026-04-02"),
    ]);

    const summary = calculateMonthSummary(entriesByDate, workingDays);

    expect(summary.delayMinutes).toBe(45); // 15 + 30
  });

  it("mês vazio = todas faltas", () => {
    const workingDays = ["2026-04-01", "2026-04-02", "2026-04-03"];
    const entriesByDate = new Map();

    const summary = calculateMonthSummary(entriesByDate, workingDays);

    expect(summary.totalHours).toBe(0);
    expect(summary.overtimeHours).toBe(0);
    expect(summary.absenceDays).toBe(3);
  });

  it("dia incompleto não conta como falta nem soma horas", () => {
    const workingDays = ["2026-04-01"];
    const entriesByDate = new Map();

    entriesByDate.set("2026-04-01", [
      entry("entrada", "08:00", "2026-04-01"),
    ]);

    const summary = calculateMonthSummary(entriesByDate, workingDays);

    expect(summary.totalHours).toBe(0);
    expect(summary.absenceDays).toBe(0); // não é falta, é incompleto
    expect(summary.dailyResults[0].isIncomplete).toBe(true);
  });
});
