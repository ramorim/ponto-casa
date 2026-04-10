import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmployer } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireEmployer();
  if (auth instanceof NextResponse) return auth;

  const status = request.nextUrl.searchParams.get("status") || "pending";

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employer_invites")
    .select("id, token, status, invited_phone, invited_email, created_at, expires_at")
    .eq("employer_id", auth.user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("List invites error:", error);
    return NextResponse.json(
      { error: "Erro ao listar convites" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function POST() {
  const auth = await requireEmployer();
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("employer_invites")
    .insert({ employer_id: auth.user.id })
    .select()
    .single();

  if (error || !data) {
    console.error("Create invite error:", error);
    return NextResponse.json(
      { error: "Erro ao criar convite" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
