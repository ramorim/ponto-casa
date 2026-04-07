"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      router.push("/");
    } else {
      setError(result.error || "Código incorreto");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  }, [phoneOrEmail, verifyOtp, router]);

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
      ? phoneOrEmail.replace("+55", "(").replace(/(\d{2})(\d{5})(\d{4})/, "$1) $2-$3")
      : phoneOrEmail;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verificar código</CardTitle>
          <CardDescription>
            Enviamos um código para{" "}
            <strong>{displayContact}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
                className="h-12 w-12 text-center text-lg font-bold"
                disabled={isLoading}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {isLoading && (
            <p className="text-center text-sm text-muted-foreground">
              Verificando...
            </p>
          )}

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">
                Reenviar em {resendTimer}s
              </p>
            ) : (
              <Button variant="ghost" onClick={handleResend} className="text-sm">
                Reenviar código
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            Voltar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
