import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, verifyEmployerOf } from "@/lib/api-auth";

// GET — returns the current work schedule for an employee
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const employeeId = request.nextUrl.searchParams.get("employee_id");
  if (!employeeId) {
    return NextResponse.json(
      { error: "employee_id obrigatório" },
      { status: 400 }
    );
  }

  // Allow own schedule or employer viewing their employee
  const isSelf = employeeId === auth.user.id;
  const isEmployer = !isSelf && (await verifyEmployerOf(auth.user.id, employeeId));
  if (!isSelf && !isEmployer) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("work_schedules")
    .select("*")
    .eq("employee_id", employeeId)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data);
}

// POST — create or update work schedule (employer only)
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { employee_id, start_time, lunch_start, lunch_end, end_time } = body as {
    employee_id?: string;
    start_time?: string;
    lunch_start?: string;
    lunch_end?: string;
    end_time?: string;
  };

  if (!employee_id || !start_time || !lunch_start || !lunch_end || !end_time) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios" },
      { status: 400 }
    );
  }

  const isEmployer = await verifyEmployerOf(auth.user.id, employee_id);
  if (!isEmployer) {
    return NextResponse.json(
      { error: "Apenas o empregador pode definir o horário" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // Close previous schedule (set valid_until)
  const today = new Date().toISOString().split("T")[0];
  await admin
    .from("work_schedules")
    .update({ valid_until: today })
    .eq("employee_id", employee_id)
    .is("valid_until", null);

  // Insert new schedule
  const { data, error } = await admin
    .from("work_schedules")
    .insert({
      employee_id,
      start_time,
      lunch_start,
      lunch_end,
      end_time,
      valid_from: today,
    })
    .select()
    .single();

  if (error) {
    console.error("Work schedule create error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar horário" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
