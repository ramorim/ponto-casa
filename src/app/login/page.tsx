"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

type AuthType = "whatsapp" | "email";

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const [authType, setAuthType] = useState<AuthType>("whatsapp");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const value =
      authType === "whatsapp" ? formatPhone(phoneOrEmail) : phoneOrEmail;
    const result = await sendOtp(value, authType);

    setIsLoading(false);

    if (result.success) {
      const params = new URLSearchParams({
        phoneOrEmail: value,
        type: authType,
      });
      router.push(`/login/verify?${params.toString()}`);
    } else {
      setError(result.error || "Erro ao enviar código");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo + branding */}
        <div className="text-center space-y-3">
          <Image
            src="/icons/logo.svg"
            alt="Ponto Casa"
            width={72}
            height={72}
            className="mx-auto"
            priority
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ponto Casa</h1>
            <p className="text-sm text-gray-500 mt-1">
              Controle de jornada doméstica
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex gap-3 items-start bg-blue-50 border border-blue-100 rounded-xl p-4">
          <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>Sem senha.</strong> Escolha receber um código de acesso
            por <strong>WhatsApp</strong> ou <strong>email</strong>. O código
            é enviado na hora e expira em 5 minutos.
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
          {/* Auth type toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                authType === "whatsapp"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setAuthType("whatsapp");
                setPhoneOrEmail("");
                setError("");
              }}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                authType === "email"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setAuthType("email");
                setPhoneOrEmail("");
                setError("");
              }}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSendOtp} className="space-y-4">
            {authType === "whatsapp" ? (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneOrEmail}
                  onChange={(e) =>
                    setPhoneOrEmail(formatPhoneInput(e.target.value))
                  }
                  required
                  autoFocus
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-400">
                  Você receberá um código de 6 dígitos no WhatsApp
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-12 text-base"
                />
                <p className="text-xs text-gray-400">
                  Você receberá um código de 6 dígitos no email
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-blue-700 hover:bg-blue-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              {isLoading ? "Enviando..." : "Enviar código"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 leading-relaxed">
          Ao continuar, você concorda com os{" "}
          <Link href="/termos" className="underline hover:text-gray-600">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="underline hover:text-gray-600">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatPhone(value: string): string {
  return value.replace(/\D/g, "");
}
