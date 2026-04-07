import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
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

    // Verify closing exists and belongs to this employee
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

    if (closing.employee_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o(a) funcionário(a) pode aceitar o fechamento" },
        { status: 403 }
      );
    }

    if (closing.employee_accepted) {
      return NextResponse.json(
        { error: "Este fechamento já foi aceito" },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("monthly_closings")
      .update({
        employee_accepted: true,
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error accepting closing:", updateError);
      return NextResponse.json(
        { error: "Erro ao aceitar fechamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Fechamento aceito" });
  } catch (err) {
    console.error("closings/accept error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
