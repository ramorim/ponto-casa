"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        {state === "invalid" && (
          <>
            <CardHeader className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle>Convite inválido</CardTitle>
              <CardDescription>
                {errorMessage || "Este convite expirou ou já foi utilizado."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/")}>
                Ir para início
              </Button>
            </CardContent>
          </>
        )}

        {state === "valid" && (
          <>
            <CardHeader className="text-center">
              <CardTitle>Convite recebido</CardTitle>
              <CardDescription>
                <strong>{employerName}</strong> convidou você para registrar
                seu ponto. Complete seus dados para aceitar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                />
                {errors.cpf && (
                  <p className="text-xs text-destructive">{errors.cpf}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
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

              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={isAccepting}
              >
                {isAccepting ? "Aceitando..." : "Aceitar convite"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Recusar
              </Button>
            </CardContent>
          </>
        )}

        {state === "accepted" && (
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle>Convite aceito!</CardTitle>
            <CardDescription>
              Você foi vinculado(a) a {employerName}. Redirecionando...
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    </main>
  );
}
