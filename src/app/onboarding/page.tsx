"use client";

import { useEffect, useState } from "react";
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
import { Briefcase, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  cleanDigits,
  isValidCpf,
  isValidEmail,
  isValidPhoneBr,
  maskCpf,
  maskPhoneBr,
} from "@/lib/validation";

type Step = "info" | "role";

export default function OnboardingPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Detect if user signed up via WhatsApp (synthetic email = no real email)
  const signedUpViaPhone = profile?.email?.endsWith("@pontocasa.app") ?? false;

  // Hydrate from profile when it loads
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.cpf) setCpf(maskCpf(profile.cpf));
      if (profile.phone) setPhone(maskPhoneBr(profile.phone));
      if (profile.email && !profile.email.endsWith("@pontocasa.app")) {
        setEmail(profile.email);
      }
    }
  }, [profile]);

  // If there's a pending invite token, prioritize accepting it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingToken = sessionStorage.getItem("pending-invite-token");
    if (pendingToken) {
      sessionStorage.removeItem("pending-invite-token");
      window.location.href = `/convite/${pendingToken}`;
    }
  }, []);

  // If onboarding already completed, leave
  useEffect(() => {
    if (profile?.onboarding_completed) {
      window.location.href = profile.role === "employer" ? "/funcionarios" : "/";
    }
  }, [profile]);

  function validateInfo(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (!cpf) errs.cpf = "CPF é obrigatório";
    else if (!isValidCpf(cpf)) errs.cpf = "CPF inválido";
    if (phone && !isValidPhoneBr(phone)) errs.phone = "Telefone inválido";
    if (signedUpViaPhone && !email.trim()) errs.email = "Email é obrigatório";
    else if (email && !isValidEmail(email)) errs.email = "Email inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateInfo()) return;
    setStep("role");
  }

  async function handleRoleSelect(role: "employer" | "employee") {
    setIsLoading(true);

    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cpf: cleanDigits(cpf),
          phone: phone ? cleanDigits(phone) : null,
          email: email.trim() || null,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        setIsLoading(false);
        return;
      }

      window.location.href = role === "employer" ? "/funcionarios" : "/";
    } catch (err) {
      console.error("onboarding error:", err);
      toast.error("Erro de conexão");
      setIsLoading(false);
    }
  }

  if (authLoading || !profile) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo ao Ponto Casa</CardTitle>
          <CardDescription>
            {step === "info"
              ? "Conte um pouco sobre você"
              : "Qual é o seu perfil?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "info" && (
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(maskCpf(e.target.value))}
                  inputMode="numeric"
                  required
                />
                {errors.cpf && (
                  <p className="text-xs text-destructive">{errors.cpf}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telefone {!signedUpViaPhone && "(opcional)"}
                </Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(maskPhoneBr(e.target.value))}
                  inputMode="tel"
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email{" "}
                  {signedUpViaPhone ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    "(opcional)"
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Continuar
              </Button>
            </form>
          )}

          {step === "role" && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="flex h-20 w-full items-center justify-start gap-4 p-4"
                onClick={() => handleRoleSelect("employer")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Briefcase className="h-8 w-8 text-primary" />
                )}
                <div className="text-left">
                  <p className="font-semibold">Sou Empregador(a)</p>
                  <p className="text-sm text-muted-foreground">
                    Quero gerenciar o ponto dos meus funcionários
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="flex h-20 w-full items-center justify-start gap-4 p-4"
                onClick={() => handleRoleSelect("employee")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
                <div className="text-left">
                  <p className="font-semibold">Sou Funcionário(a)</p>
                  <p className="text-sm text-muted-foreground">
                    Quero registrar meu ponto diário
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("info")}
                disabled={isLoading}
              >
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
