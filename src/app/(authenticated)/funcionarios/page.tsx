"use client";

import { useCallback, useEffect, useState } from "react";
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
import {
  UserPlus,
  Copy,
  MessageCircle,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
}

interface Invite {
  id: string;
  token: string;
  status: string;
  invited_phone: string | null;
  created_at: string;
  expires_at: string;
}

interface ConnectionRequest {
  id: string;
  employee_id: string;
  status: string;
  message: string | null;
  created_at: string;
  employee_name: string;
  employee_phone: string;
}

export default function FuncionariosPage() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!profile) return;

    // Load employees
    const { data: emps } = await supabase
      .from("profiles")
      .select("id, name, phone, is_active")
      .eq("employer_id", profile.id);
    setEmployees(emps || []);

    // Load pending invites
    const { data: invs } = await supabase
      .from("employer_invites")
      .select("*")
      .eq("employer_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setInvites(invs || []);

    // Load pending connection requests
    const { data: reqs } = await supabase
      .from("connection_requests")
      .select("id, employee_id, status, message, created_at")
      .eq("employer_id", profile.id)
      .eq("status", "pending");

    if (reqs && reqs.length > 0) {
      const employeeIds = reqs.map((r) => r.employee_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, phone")
        .in("id", employeeIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      setRequests(
        reqs.map((r) => ({
          ...r,
          employee_name: profileMap.get(r.employee_id)?.name || "",
          employee_phone: profileMap.get(r.employee_id)?.phone || "",
        }))
      );
    } else {
      setRequests([]);
    }
  }, [profile, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createInvite() {
    if (!profile) return;
    setIsCreatingInvite(true);

    const { data, error } = await supabase
      .from("employer_invites")
      .insert({ employer_id: profile.id })
      .select("token")
      .single();

    if (error || !data) {
      toast.error("Erro ao criar convite");
      setIsCreatingInvite(false);
      return;
    }

    const inviteUrl = `${window.location.origin}/convite/${data.token}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copiado!");
    setIsCreatingInvite(false);
    loadData();
  }

  function shareViaWhatsApp(token: string) {
    const inviteUrl = `${window.location.origin}/convite/${token}`;
    const text = encodeURIComponent(
      `Olá! Estou te convidando para registrar seu ponto pelo Ponto Casa. Acesse: ${inviteUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function copyInviteLink(token: string) {
    const inviteUrl = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copiado!");
  }

  async function handleRequest(requestId: string, action: "accepted" | "rejected") {
    const request = requests.find((r) => r.id === requestId);
    if (!request || !profile) return;

    if (action === "accepted") {
      // Link employee to this employer
      await supabase
        .from("profiles")
        .update({ employer_id: profile.id })
        .eq("id", request.employee_id);
    }

    await supabase
      .from("connection_requests")
      .update({ status: action })
      .eq("id", requestId);

    toast.success(action === "accepted" ? "Solicitação aceita" : "Solicitação recusada");
    loadData();
  }

  async function revokeInvite(inviteId: string) {
    await supabase
      .from("employer_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId);
    toast.success("Convite revogado");
    loadData();
  }

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full">
      <h1 className="text-xl font-bold">Funcionários</h1>

      {/* Connection Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Solicitações pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{req.employee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.employee_phone}
                  </p>
                  {req.message && (
                    <p className="text-sm italic">{req.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequest(req.id, "accepted")}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequest(req.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Employees List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meus funcionários
            </CardTitle>
            <Button size="sm" onClick={createInvite} disabled={isCreatingInvite}>
              <UserPlus className="mr-1 h-4 w-4" />
              Convidar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum funcionário vinculado. Convide alguém!
            </p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">{emp.phone}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      emp.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {emp.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Convites pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="text-sm text-muted-foreground">
                  Criado em{" "}
                  {new Date(inv.created_at).toLocaleDateString("pt-BR")}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyInviteLink(inv.token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => shareViaWhatsApp(inv.token)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => revokeInvite(inv.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
