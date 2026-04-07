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
import { Briefcase, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Step = "name" | "role" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>(profile?.name ? "role" : "name");
  const [name, setName] = useState(profile?.name || "");
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("role");
  }

  async function handleRoleSelect(role: "employer" | "employee") {
    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        role,
        onboarding_completed: true,
      })
      .eq("id", profile?.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
      setIsLoading(false);
      return;
    }

    await refreshProfile();
    setIsLoading(false);

    if (role === "employer") {
      router.push("/funcionarios");
    } else {
      router.push("/");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo ao Ponto Casa</CardTitle>
          <CardDescription>
            {step === "name"
              ? "Como podemos te chamar?"
              : "Qual é o seu perfil?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "name" && (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!name.trim()}>
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
                <Briefcase className="h-8 w-8 text-primary" />
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
                <User className="h-8 w-8 text-primary" />
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
                onClick={() => setStep("name")}
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
