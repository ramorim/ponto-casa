import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("user_devices")
    .delete()
    .eq("device_id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao remover dispositivo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
