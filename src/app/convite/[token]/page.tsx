"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  cleanDigits,
  isValidCpf,
  isValidPhoneBr,
  maskCpf,
  maskPhoneBr,
} from "@/lib/validation";

type InviteState = "loading" | "valid" | "invalid" | "accepted";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const token = params.token as string;

  const [state, setState] = useState<InviteState>("loading");
  const [employerName, setEmployerName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  // Form fields (collected before accepting)
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hydrate form from profile
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.cpf) setCpf(maskCpf(profile.cpf));
      if (profile.phone) setPhone(maskPhoneBr(profile.phone));
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;

    // Not authenticated → save token and go to login
    if (!user) {
      sessionStorage.setItem("pending-invite-token", token);
      router.push("/login");
      return;
    }

    // Load invite info via API (uses admin client, bypasses RLS)
    let cancelled = false;
    async function loadInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErrorMessage(data.error || "Convite inválido");
          setState("invalid");
          return;
        }

        setEmployerName(data.employer_name);
        setState("valid");
      } catch {
        if (cancelled) return;
        setErrorMessage("Erro ao carregar convite");
        setState("invalid");
      }
    }
    loadInvite();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, token, router]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Nome é obrigatório";
    if (!cpf) errs.cpf = "CPF é obrigatório";
    else if (!isValidCpf(cpf)) errs.cpf = "CPF inválido";
    if (phone && !isValidPhoneBr(phone)) errs.phone = "Telefone inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAccept() {
    if (!validate()) return;
    setIsAccepting(true);

    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cpf: cleanDigits(cpf),
          phone: phone ? cleanDigits(phone) : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao aceitar convite");
        setIsAccepting(false);
        return;
      }

      setState("accepted");
      toast.success("Convite aceito!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch {
      toast.error("Erro de conexão");
      setIsAccepting(false);
    }
  }

  if (state === "loading" || authLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Image src="/icons/logo.svg" alt="Ponto Casa" width={48} height={48} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          {state === "invalid" && (
            <div className="text-center space-y-4">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h1 className="text-xl font-bold text-gray-900">Convite inválido</h1>
              <p className="text-sm text-gray-500">
                {errorMessage || "Este convite expirou ou já foi utilizado."}
              </p>
              <Button className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold" onClick={() => router.push("/")}>
                Ir para início
              </Button>
            </div>
          )}

          {state === "valid" && (
            <div className="space-y-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900">Convite recebido</h1>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>{employerName}</strong> convidou você para registrar
                  seu ponto. Complete seus dados para aceitar.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    className="h-12 text-base"
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-700">{errors.name}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-gray-700">
                    CPF <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    className="h-12 text-base"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCpf(e.target.value))}
                    inputMode="numeric"
                  />
                  {errors.cpf && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-700">{errors.cpf}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Telefone (opcional)</Label>
                  <Input
                    id="phone"
                    className="h-12 text-base"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(maskPhoneBr(e.target.value))}
                    inputMode="tel"
                  />
                  {errors.phone && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-700">{errors.phone}</p>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800 h-12 text-base font-semibold"
                  onClick={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? "Aceitando..." : "Aceitar convite"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => router.push("/")}
                >
                  Recusar
                </Button>
              </div>
            </div>
          )}

          {state === "accepted" && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Convite aceito!</h1>
              <p className="text-sm text-gray-500">
                Você foi vinculado(a) a {employerName}. Redirecionando...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
