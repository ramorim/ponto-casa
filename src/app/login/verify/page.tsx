"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyOtp, sendOtp } = useAuth();

  const phoneOrEmail = searchParams.get("phoneOrEmail") || "";
  const type = (searchParams.get("type") as "whatsapp" | "email") || "whatsapp";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no phoneOrEmail
  useEffect(() => {
    if (!phoneOrEmail) router.replace("/login");
  }, [phoneOrEmail, router]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = useCallback(async (code: string) => {
    setError("");
    setIsLoading(true);
    const result = await verifyOtp(phoneOrEmail, code);
    setIsLoading(false);

    if (result.success) {
      // Hard navigation so middleware sees the new session cookies
      window.location.href = "/";
    } else {
      setError(result.error || "Código incorreto");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [phoneOrEmail, verifyOtp]);

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (value && newDigits.every((d) => d)) {
      handleSubmit(newDigits.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
    setDigits(newDigits);
    if (pasted.length === OTP_LENGTH) {
      handleSubmit(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  async function handleResend() {
    setError("");
    setResendTimer(RESEND_COOLDOWN);
    const result = await sendOtp(phoneOrEmail, type);
    if (!result.success) {
      setError(result.error || "Erro ao reenviar");
    }
  }

  const displayContact =
    type === "whatsapp"
      ? phoneOrEmail.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
      : phoneOrEmail;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Verificar código</h1>
          <p className="text-sm text-gray-500">
            Enviamos um código para{" "}
            <strong className="text-gray-700">{displayContact}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-12 text-center text-xl font-bold rounded-xl"
                disabled={isLoading}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm font-medium">Verificando...</p>
            </div>
          )}

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-400">
                Reenviar em {resendTimer}s
              </p>
            ) : (
              <Button variant="ghost" onClick={handleResend} className="text-sm text-blue-700">
                Reenviar código
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => router.back()}
          >
            Voltar
          </Button>
        </div>
      </div>
    </main>
  );
}
