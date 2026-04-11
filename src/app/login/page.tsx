"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Mail } from "lucide-react";

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

    const value = authType === "whatsapp" ? formatPhone(phoneOrEmail) : phoneOrEmail;
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
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Ponto Casa</CardTitle>
          <CardDescription>
            Entre com seu{" "}
            {authType === "whatsapp" ? "WhatsApp" : "email"} para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button
              variant={authType === "whatsapp" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setAuthType("whatsapp")}
              type="button"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              variant={authType === "email" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setAuthType("email")}
              type="button"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            {authType === "whatsapp" ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(formatPhoneInput(e.target.value))}
                  required
                  autoFocus
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar código"}
            </Button>
          </form>
        </CardContent>
      </Card>
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
  // Send only the 11 digits (DDD + number), without country code.
  // The +55 is added only by zapi.ts at send time.
  return value.replace(/\D/g, "");
}
