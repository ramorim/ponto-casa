import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
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

    const body = await request.json();
    const { timestamp_server, note, reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Motivo da alteração é obrigatório" },
        { status: 400 }
      );
    }

    if (!timestamp_server && note === undefined) {
      return NextResponse.json(
        { error: "Nenhuma alteração informada" },
        { status: 400 }
      );
    }

    // Verify the entry exists and user is the employer
    const { data: entry, error: fetchError } = await supabase
      .from("time_entries")
      .select("id, employee_id, timestamp_server, note, event_type")
      .eq("id", id)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: "Registro não encontrado" },
        { status: 404 }
      );
    }

    // Verify user is the employer of this employee
    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("employer_id")
      .eq("id", entry.employee_id)
      .single();

    if (!employeeProfile || employeeProfile.employer_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o empregador pode editar registros" },
        { status: 403 }
      );
    }

    // Check if the month is closed (accepted)
    const entryDate = new Date(entry.timestamp_server);
    const monthRef = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;

    const { data: closing } = await supabase
      .from("monthly_closings")
      .select("employee_accepted")
      .eq("employee_id", entry.employee_id)
      .eq("month_ref", monthRef)
      .single();

    if (closing?.employee_accepted) {
      return NextResponse.json(
        { error: "Este mês já foi fechado e aceito. Reabra o mês para editar." },
        { status: 409 }
      );
    }

    // Set audit reason via session variable (used by the DB trigger)
    await supabase.rpc("set_config", {
      setting: "app.audit_reason",
      value: reason.trim(),
    }).then(() => {});
    // Fallback: the trigger uses current_setting with a default

    // Build update payload
    const updateData: Record<string, string> = {};
    if (timestamp_server) updateData.timestamp_server = timestamp_server;
    if (note !== undefined) updateData.note = note;

    // The audit trigger fires automatically on UPDATE
    // But since set_config via RPC might not work with RLS, we also insert audit manually
    if (timestamp_server && timestamp_server !== entry.timestamp_server) {
      await supabase.from("time_entry_audit").insert({
        entry_id: id,
        field_changed: "timestamp_server",
        previous_value: entry.timestamp_server,
        new_value: timestamp_server,
        changed_by: user.id,
        reason: reason.trim(),
      });
    }

    if (note !== undefined && note !== entry.note) {
      await supabase.from("time_entry_audit").insert({
        entry_id: id,
        field_changed: "note",
        previous_value: entry.note,
        new_value: note,
        changed_by: user.id,
        reason: reason.trim(),
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from("time_entries")
      .update(updateData)
      .eq("id", id)
      .select("id, event_type, timestamp_server, note")
      .single();

    if (updateError) {
      console.error("Error updating time entry:", updateError);
      return NextResponse.json(
        { error: "Erro ao atualizar registro" },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("time-entries PATCH error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
