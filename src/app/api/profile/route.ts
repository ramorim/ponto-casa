import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { name, cpf, phone, email } = body as {
    name?: string;
    cpf?: string | null;
    phone?: string | null;
    email?: string | null;
  };

  const updates: Record<string, string | null> = {};
  if (name !== undefined) updates.name = name?.trim() || "";
  if (cpf !== undefined) updates.cpf = cpf || null;
  if (phone !== undefined) updates.phone = phone || null;
  if (email !== undefined) updates.email = email?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada a atualizar" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", auth.user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
