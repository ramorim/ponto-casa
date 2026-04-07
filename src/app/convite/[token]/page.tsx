"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type InviteState = "loading" | "valid" | "invalid" | "accepted" | "error";

interface InviteData {
  id: string;
  employer_name: string;
  status: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const token = params.token as string;

  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Save token and redirect to login
      sessionStorage.setItem("pending-invite-token", token);
      router.push("/login");
      return;
    }

    loadInvite();
  }, [user, authLoading, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadInvite() {
    const { data, error } = await supabase
      .from("employer_invites")
      .select("id, status, employer_id, expires_at")
      .eq("token", token)
      .single();

    if (error || !data) {
      setState("invalid");
      return;
    }

    if (data.status !== "pending" || new Date(data.expires_at) < new Date()) {
      setState("invalid");
      return;
    }

    // Get employer name
    const { data: employer } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", data.employer_id)
      .single();

    setInvite({
      id: data.id,
      employer_name: employer?.name || "Empregador",
      status: data.status,
    });
    setState("valid");
  }

  async function handleAccept() {
    if (!invite || !profile) return;
    setIsAccepting(true);

    // Link employee to employer
    const { data: inviteData } = await supabase
      .from("employer_invites")
      .select("employer_id")
      .eq("id", invite.id)
      .single();

    if (!inviteData) {
      toast.error("Convite não encontrado");
      setIsAccepting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        employer_id: inviteData.employer_id,
        role: "employee",
        onboarding_completed: true,
      })
      .eq("id", profile.id);

    if (profileError) {
      toast.error("Erro ao aceitar convite");
      setIsAccepting(false);
      return;
    }

    // Mark invite as accepted
    await supabase
      .from("employer_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    setState("accepted");
    toast.success("Convite aceito!");
    setIsAccepting(false);

    setTimeout(() => router.push("/"), 1500);
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
                Este convite expirou ou já foi utilizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/")}>
                Ir para início
              </Button>
            </CardContent>
          </>
        )}

        {state === "valid" && invite && (
          <>
            <CardHeader className="text-center">
              <CardTitle>Convite recebido</CardTitle>
              <CardDescription>
                <strong>{invite.employer_name}</strong> convidou você para
                registrar seu ponto pelo Ponto Casa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
              Você foi vinculado(a) a {invite?.employer_name}. Redirecionando...
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    </main>
  );
}
