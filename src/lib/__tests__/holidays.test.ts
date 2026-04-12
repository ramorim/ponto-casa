import { describe, it, expect } from "vitest";
import { getHolidays, isHoliday } from "../holidays";

describe("getHolidays", () => {
  it("retorna feriados nacionais fixos de 2026", () => {
    const holidays = getHolidays(2026);
    expect(holidays.get("2026-01-01")).toBe("Confraternização Universal");
    expect(holidays.get("2026-04-21")).toBe("Tiradentes");
    expect(holidays.get("2026-05-01")).toBe("Dia do Trabalho");
    expect(holidays.get("2026-09-07")).toBe("Independência do Brasil");
    expect(holidays.get("2026-10-12")).toBe("Nossa Senhora Aparecida");
    expect(holidays.get("2026-11-02")).toBe("Finados");
    expect(holidays.get("2026-11-15")).toBe("Proclamação da República");
    expect(holidays.get("2026-12-25")).toBe("Natal");
  });

  it("calcula Páscoa/Carnaval/Corpus Christi de 2026 corretamente", () => {
    // Páscoa 2026: 5 de abril
    const holidays = getHolidays(2026);
    expect(holidays.get("2026-02-16")).toBe("Carnaval (segunda)");
    expect(holidays.get("2026-02-17")).toBe("Carnaval");
    expect(holidays.get("2026-04-03")).toBe("Sexta-feira Santa");
    expect(holidays.get("2026-06-04")).toBe("Corpus Christi");
  });

  it("Páscoa 2025: 20 de abril", () => {
    const holidays = getHolidays(2025);
    expect(holidays.get("2025-04-18")).toBe("Sexta-feira Santa");
  });

  it("Páscoa 2027: 28 de março", () => {
    const holidays = getHolidays(2027);
    expect(holidays.get("2027-03-26")).toBe("Sexta-feira Santa");
  });
});

describe("isHoliday", () => {
  it("retorna nome do feriado quando é feriado", () => {
    expect(isHoliday("2026-12-25")).toBe("Natal");
  });

  it("retorna null quando não é feriado", () => {
    expect(isHoliday("2026-04-07")).toBeNull(); // terça normal
  });

  it("retorna feriado regional quando cidade é passada", () => {
    // Aniversário de São Paulo: 25 de janeiro
    const result = isHoliday("2026-01-25", "São Paulo-SP");
    expect(result).toBeTruthy();
  });
});
