import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth, verifyEmployerOf } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const month = request.nextUrl.searchParams.get("month");
  const employeeId = request.nextUrl.searchParams.get("employee_id");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month obrigatório no formato YYYY-MM" },
      { status: 400 }
    );
  }

  // Determine which employee
  let targetEmployeeId = auth.user.id;
  if (employeeId && employeeId !== auth.user.id) {
    const ok = await verifyEmployerOf(auth.user.id, employeeId);
    if (!ok) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }
    targetEmployeeId = employeeId;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("monthly_closings")
    .select("*")
    .eq("employee_id", targetEmployeeId)
    .eq("month_ref", month)
    .maybeSingle();

  return NextResponse.json(data);
}
