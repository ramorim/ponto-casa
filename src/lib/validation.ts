// ── CPF ──

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCpf(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCpf(value: string): boolean {
  const cpf = cleanDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // all same digit

  // first verifier digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;

  // second verifier digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(cpf[10])) return false;

  return true;
}

// ── Phone (BR) ──

export function maskPhoneBr(value: string): string {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhoneBr(value: string): boolean {
  const digits = cleanDigits(value);
  return digits.length === 10 || digits.length === 11;
}

// ── Email ──

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
