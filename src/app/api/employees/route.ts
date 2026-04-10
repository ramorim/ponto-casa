import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmployer } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireEmployer();
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, name, phone, email, cpf, is_active")
    .eq("employer_id", auth.user.id)
    .order("name");

  if (error) {
    console.error("List employees error:", error);
    return NextResponse.json(
      { error: "Erro ao listar funcionários" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
