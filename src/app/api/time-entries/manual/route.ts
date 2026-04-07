import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { employee_id, event_type, timestamp_server, note, reason } = body;

    if (!employee_id || !event_type || !timestamp_server || !reason?.trim()) {
      return NextResponse.json(
        { error: "employee_id, event_type, timestamp_server e reason são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify user is the employer of this employee
    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("employer_id")
      .eq("id", employee_id)
      .single();

    if (!employeeProfile || employeeProfile.employer_id !== user.id) {
      return NextResponse.json(
        { error: "Apenas o empregador pode criar registros manuais" },
        { status: 403 }
      );
    }

    // Check if month is closed
    const entryDate = new Date(timestamp_server);
    const monthRef = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`;

    const { data: closing } = await supabase
      .from("monthly_closings")
      .select("employee_accepted")
      .eq("employee_id", employee_id)
      .eq("month_ref", monthRef)
      .single();

    if (closing?.employee_accepted) {
      return NextResponse.json(
        { error: "Este mês já foi fechado e aceito." },
        { status: 409 }
      );
    }

    // Insert the manual entry
    const { data: entry, error: insertError } = await supabase
      .from("time_entries")
      .insert({
        employee_id,
        event_type,
        timestamp_server,
        note: note || null,
        device_info: "Registro manual pelo empregador",
      })
      .select("id, event_type, timestamp_server")
      .single();

    if (insertError) {
      console.error("Error inserting manual entry:", insertError);
      return NextResponse.json(
        { error: "Erro ao criar registro manual" },
        { status: 500 }
      );
    }

    // Log audit for manual creation
    await supabase.from("time_entry_audit").insert({
      entry_id: entry.id,
      field_changed: "created_manually",
      previous_value: null,
      new_value: timestamp_server,
      changed_by: user.id,
      reason: reason.trim(),
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("time-entries/manual POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
