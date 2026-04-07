import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateMonthSummary,
  getWorkingDays,
} from "@/lib/calculations/hours";
import type { EventType } from "@/lib/time-entry-validation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { employee_id, month_ref } = await request.json();

    if (!employee_id || !month_ref || !/^\d{4}-\d{2}$/.test(month_ref)) {
      return NextResponse.json(
        { error: "employee_id e month_ref (YYYY-MM) são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify employer relationship
    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("employer_id")
      .eq("id", employee_id)
      .single();

    if (!employeeProfile || employeeProfile.employer_id !== user.id) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    // Fetch entries for the month
    const [year, monthNum] = month_ref.split("-").map(Number);
    const startDate = new Date(`${month_ref}-01T00:00:00-03:00`);
    const nextMonth =
      monthNum === 12
        ? `${year + 1}-01-01T00:00:00-03:00`
        : `${year}-${String(monthNum + 1).padStart(2, "0")}-01T00:00:00-03:00`;

    const { data: entries } = await supabase
      .from("time_entries")
      .select("event_type, timestamp_server")
      .eq("employee_id", employee_id)
      .gte("timestamp_server", startDate.toISOString())
      .lt("timestamp_server", new Date(nextMonth).toISOString())
      .order("timestamp_server", { ascending: true });

    // Group by date
    const byDate = new Map<string, { event_type: EventType; timestamp_server: string }[]>();
    for (const entry of entries || []) {
      const spDate = new Date(entry.timestamp_server).toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      });
      if (!byDate.has(spDate)) byDate.set(spDate, []);
      byDate.get(spDate)!.push(entry as { event_type: EventType; timestamp_server: string });
    }

    // Get work schedule
    const { data: schedule } = await supabase
      .from("work_schedules")
      .select("start_time, lunch_start, lunch_end, end_time")
      .eq("employee_id", employee_id)
      .order("valid_from", { ascending: false })
      .limit(1)
      .single();

    const workingDays = getWorkingDays(month_ref);
    const summary = calculateMonthSummary(
      byDate,
      workingDays,
      schedule || undefined
    );

    // Upsert closing
    const { data: closing, error: upsertError } = await supabase
      .from("monthly_closings")
      .upsert(
        {
          employee_id,
          month_ref,
          total_hours: summary.totalHours,
          overtime_hours: summary.overtimeHours,
          delay_minutes: summary.delayMinutes,
          absence_days: summary.absenceDays,
          created_by: user.id,
        },
        { onConflict: "employee_id,month_ref" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting closing:", upsertError);
      return NextResponse.json(
        { error: "Erro ao gerar fechamento" },
        { status: 500 }
      );
    }

    return NextResponse.json({ closing, summary });
  } catch (err) {
    console.error("closings/generate error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
