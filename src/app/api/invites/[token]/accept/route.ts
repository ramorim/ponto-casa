import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, cpf, phone } = body as {
      name?: string;
      cpf?: string;
      phone?: string | null;
    };

    if (!name?.trim() || !cpf?.trim()) {
      return NextResponse.json(
        { error: "Nome e CPF são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Use admin client to bypass RLS for the cross-user updates
    const admin = createAdminClient();

    // Validate invite
    const { data: invite, error: inviteError } = await admin
      .from("employer_invites")
      .select("id, employer_id, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Convite não encontrado" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Este convite já foi utilizado ou revogado" },
        { status: 409 }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Este convite expirou" },
        { status: 410 }
      );
    }

    // Verify employer still exists and is active
    const { data: employer } = await admin
      .from("profiles")
      .select("id, name, is_active")
      .eq("id", invite.employer_id)
      .single();

    if (!employer || !employer.is_active) {
      return NextResponse.json(
        { error: "Empregador(a) não encontrado(a)" },
        { status: 404 }
      );
    }

    // Link the authenticated user as employee of this employer
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        name: name.trim(),
        cpf,
        phone: phone || null,
        employer_id: invite.employer_id,
        role: "employee",
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      if (profileError.code === "23505") {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado em outra conta" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Erro ao vincular ao empregador" },
        { status: 500 }
      );
    }

    // Mark invite as accepted
    const { error: inviteUpdateError } = await admin
      .from("employer_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    if (inviteUpdateError) {
      console.error("Invite update error:", inviteUpdateError);
      // Profile already updated; just log and continue
    }

    return NextResponse.json({
      message: "Convite aceito",
      employer_name: employer.name,
    });
  } catch (err) {
    console.error("invite accept error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
