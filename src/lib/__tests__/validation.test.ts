import { describe, it, expect } from "vitest";
import {
  isValidCpf,
  maskCpf,
  isValidPhoneBr,
  maskPhoneBr,
  isValidEmail,
  cleanDigits,
} from "../validation";

describe("CPF", () => {
  it("valida CPF correto", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita CPF inválido", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false); // todos iguais
    expect(isValidCpf("123.456.789-00")).toBe(false); // dígito errado
    expect(isValidCpf("123")).toBe(false); // curto
    expect(isValidCpf("")).toBe(false);
  });

  it("mascara CPF corretamente", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("529")).toBe("529");
    expect(maskCpf("52998")).toBe("529.98");
    expect(maskCpf("5299822")).toBe("529.982.2");
  });
});

describe("Telefone BR", () => {
  it("valida telefone com 11 dígitos (celular)", () => {
    expect(isValidPhoneBr("21988938373")).toBe(true);
    expect(isValidPhoneBr("(21) 98893-8373")).toBe(true);
  });

  it("valida telefone com 10 dígitos (fixo)", () => {
    expect(isValidPhoneBr("2133334444")).toBe(true);
  });

  it("rejeita telefone curto", () => {
    expect(isValidPhoneBr("21988")).toBe(false);
    expect(isValidPhoneBr("")).toBe(false);
  });

  it("mascara telefone corretamente", () => {
    expect(maskPhoneBr("21988938373")).toBe("(21) 98893-8373");
    expect(maskPhoneBr("21")).toBe("(21");
    expect(maskPhoneBr("219889")).toBe("(21) 9889");
  });
});

describe("Email", () => {
  it("valida emails corretos", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co")).toBe(true);
  });

  it("rejeita emails inválidos", () => {
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("cleanDigits", () => {
  it("remove tudo que não é dígito", () => {
    expect(cleanDigits("(21) 98893-8373")).toBe("21988938373");
    expect(cleanDigits("529.982.247-25")).toBe("52998224725");
    expect(cleanDigits("+55 21")).toBe("5521");
  });
});
