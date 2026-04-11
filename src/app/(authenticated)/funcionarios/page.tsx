"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  UserPlus,
  Copy,
  MessageCircle,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Timer,
} from "lucide-react";
import { ListSkeleton } from "@/components/skeletons";
import { WorkScheduleDialog } from "@/components/work-schedule-dialog";

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
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
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [scheduleEmployee, setScheduleEmployee] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [empsRes, invsRes, reqsRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/invites?status=pending"),
        fetch("/api/connection-requests?status=pending"),
      ]);

      if (empsRes.ok) setEmployees(await empsRes.json());
      if (invsRes.ok) setInvites(await invsRes.json());
      if (reqsRes.ok) setRequests(await reqsRes.json());
    } catch (err) {
      console.error("loadData error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createInvite() {
    setIsCreatingInvite(true);
    try {
      const res = await fetch("/api/invites", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar convite");
        return;
      }
      const inviteUrl = `${window.location.origin}/convite/${data.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copiado!");
      loadData();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsCreatingInvite(false);
    }
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

  async function handleRequest(
    requestId: string,
    action: "accepted" | "rejected"
  ) {
    const res = await fetch(`/api/connection-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Erro");
      return;
    }
    toast.success(action === "accepted" ? "Solicitação aceita" : "Solicitação recusada");
    loadData();
  }

  async function revokeInvite(token: string) {
    const res = await fetch(`/api/invites/${token}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao revogar");
      return;
    }
    toast.success("Convite revogado");
    loadData();
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full bg-gray-50 min-h-full">
        <h1 className="text-xl font-bold text-gray-900">Funcionários</h1>
        <ListSkeleton count={3} />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-4 gap-4 max-w-lg mx-auto w-full bg-gray-50 min-h-full">
      <h1 className="text-xl font-bold text-gray-900">Funcionários</h1>

      {/* Connection Requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-base font-semibold text-gray-900">Solicitações pendentes</h2>
          </div>
          <div className="px-4 pb-4 space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{req.employee_name}</p>
                  <p className="text-sm text-gray-500">
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
                    className="h-11"
                    onClick={() => handleRequest(req.id, "accepted")}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-11"
                    onClick={() => handleRequest(req.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees List */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meus funcionários
            </h2>
            <Button size="sm" className="bg-blue-700 hover:bg-blue-800 font-semibold" onClick={createInvite} disabled={isCreatingInvite}>
              <UserPlus className="mr-1 h-4 w-4" />
              Convidar
            </Button>
          </div>
        </div>
        <div className="px-4 pb-4">
          {employees.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Nenhum funcionário vinculado. Convide alguém!
            </p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => router.push(`/historico?employee_id=${emp.id}`)}
                  >
                    <p className="font-medium truncate text-gray-900">{emp.name || "Sem nome"}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {emp.phone || emp.email || "—"}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Definir horário de trabalho"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduleEmployee({
                          id: emp.id,
                          name: emp.name || "Funcionário(a)",
                        });
                      }}
                    >
                      <Timer className="h-4 w-4" />
                    </Button>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Convites pendentes
            </h2>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="text-sm text-gray-500">
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
                    onClick={() => revokeInvite(inv.token)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work schedule dialog */}
      {scheduleEmployee && (
        <WorkScheduleDialog
          open={true}
          onClose={() => setScheduleEmployee(null)}
          employeeId={scheduleEmployee.id}
          employeeName={scheduleEmployee.name}
        />
      )}
    </main>
  );
}
