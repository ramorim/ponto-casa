"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
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
      <h1 className="text-xl font-bold text-gray-900">Meu perfil</h1>

      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Dados pessoais</h2>
          <p className="text-sm text-gray-500 mt-1">
            {profile.role === "employer" ? "Empregador(a)" : "Funcionário(a)"}
          </p>
        </div>
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              className="h-12 text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
            {errors.name && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.name}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-gray-700">CPF</Label>
            <Input
              id="cpf"
              className="h-12 text-base"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
            {errors.cpf && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.cpf}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-700">Telefone</Label>
            <Input
              id="phone"
              className="h-12 text-base"
              value={phone}
              onChange={(e) => setPhone(maskPhoneBr(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
            {errors.phone && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.phone}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input
              id="email"
              className="h-12 text-base"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            {errors.email && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{errors.email}</p>
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      </div>

      <DevicesCard />

      <Button
        variant="outline"
        className="w-full h-11 text-destructive"
        onClick={async () => {
          await signOut();
          window.location.href = "/login";
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair da conta
      </Button>

      <div className="text-center text-xs text-gray-400 space-x-3 pb-4">
        <Link href="/termos" className="underline hover:text-gray-600">
          Termos de Uso
        </Link>
        <Link href="/privacidade" className="underline hover:text-gray-600">
          Política de Privacidade
        </Link>
      </div>
    </main>
  );
}
