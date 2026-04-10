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
import { toast } from "sonner";
import { ProfileSkeleton } from "@/components/skeletons";
import { DevicesCard } from "@/components/devices-card";
import { Loader2, Save, LogOut } from "lucide-react";
import {
  cleanDigits,
  isValidCpf,
  isValidEmail,
  isValidPhoneBr,
  maskCpf,
  maskPhoneBr,
} from "@/lib/validation";

export default function PerfilPage() {
  const { profile, refreshProfile, signOut, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCpf(maskCpf(profile.cpf || ""));
      setPhone(maskPhoneBr(profile.phone || ""));
      setEmail(profile.email || "");
    }
  }, [profile]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (cpf && !isValidCpf(cpf)) errs.cpf = "CPF inválido";
    if (phone && !isValidPhoneBr(phone)) errs.phone = "Telefone inválido";
    if (email && !isValidEmail(email)) errs.email = "Email inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!profile) return;
    if (!validate()) return;

    setIsSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cpf: cpf ? cleanDigits(cpf) : null,
          phone: phone ? cleanDigits(phone) : null,
          email: email.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        setIsSaving(false);
        return;
      }

      await refreshProfile();
      toast.success("Perfil atualizado");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      <h1 className="text-xl font-bold">Meu perfil</h1>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados pessoais</CardTitle>
          <CardDescription>
            {profile.role === "employer" ? "Empregador(a)" : "Funcionário(a)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            {errors.cpf && (
              <p className="text-xs text-destructive">{errors.cpf}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(maskPhoneBr(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <Button onClick={handleSave} className="w-full" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      <DevicesCard />

      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={async () => {
          await signOut();
          window.location.href = "/login";
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair da conta
      </Button>
    </main>
  );
}
