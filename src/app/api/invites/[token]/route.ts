import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmployer } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const admin = createAdminClient();

    const { data: invite, error } = await admin
      .from("employer_invites")
      .select("id, employer_id, status, expires_at")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: "Convite não encontrado", state: "invalid" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Convite já utilizado ou revogado", state: "invalid" },
        { status: 409 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Convite expirado", state: "invalid" },
        { status: 410 }
      );
    }

    const { data: employer } = await admin
      .from("profiles")
      .select("name")
      .eq("id", invite.employer_id)
      .single();

    return NextResponse.json({
      state: "valid",
      employer_name: employer?.name || "Empregador(a)",
    });
  } catch (err) {
    console.error("invite GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Revoke an invite (employer only). Accepts the invite token as the path param.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const auth = await requireEmployer();
  if (auth instanceof NextResponse) return auth;

  const { token } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("employer_invites")
    .update({ status: "revoked" })
    .eq("token", token)
    .eq("employer_id", auth.user.id);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao revogar convite" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
