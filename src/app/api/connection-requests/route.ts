import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmployer } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireEmployer();
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get("status") || "pending";

  const admin = createAdminClient();
  const { data: requests, error } = await admin
    .from("connection_requests")
    .select("id, employee_id, status, message, created_at")
    .eq("employer_id", auth.user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("List requests error:", error);
    return NextResponse.json(
      { error: "Erro ao listar solicitações" },
      { status: 500 }
    );
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json([]);
  }

  // Enrich with employee info
  const employeeIds = requests.map((r) => r.employee_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, phone, email")
    .in("id", employeeIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const enriched = requests.map((r) => ({
    ...r,
    employee_name: profileMap.get(r.employee_id)?.name || "",
    employee_phone: profileMap.get(r.employee_id)?.phone || "",
    employee_email: profileMap.get(r.employee_id)?.email || "",
  }));

  return NextResponse.json(enriched);
}
