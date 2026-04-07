import { createHash, randomInt } from "crypto";

export function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function verifyOtpCode(code: string, hash: string): boolean {
  return hashOtpCode(code) === hash;
}
