import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { reason } = await request.json();

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: "Motivo é obrigatório para reabrir o mês" },
        { status: 400 }
      );
    }

    // Verify closing exists
    const { data: closing } = await supabase
      .from("monthly_closings")
      .select("id, employee_id, employee_accepted")
      .eq("id", id)
      .single();

    if (!closing) {
      return NextResponse.json(
        { error: "Fechamento não encontrado" },
        { status: 404 }
      );
    }

    // Verify employer
    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("employer_id")
      .eq("id", closing.employee_id)
      .single();

    if (!employeeProfile || employeeProfile.employer_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o empregador pode reabrir o fechamento" },
        { status: 403 }
      );
    }

    if (!closing.employee_accepted) {
      return NextResponse.json(
        { error: "Este fechamento não está aceito" },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("monthly_closings")
      .update({
        employee_accepted: false,
        accepted_at: null,
        accepted_by: null,
        notes: `Reaberto por empregador: ${reason.trim()}`,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error reopening closing:", updateError);
      return NextResponse.json(
        { error: "Erro ao reabrir fechamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Fechamento reaberto" });
  } catch (err) {
    console.error("closings/reopen error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
