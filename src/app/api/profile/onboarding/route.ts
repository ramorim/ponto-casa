import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, cpf, phone, email, role } = body as {
      name?: string;
      cpf?: string;
      phone?: string | null;
      email?: string | null;
      role?: "employer" | "employee";
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }
    if (!cpf?.trim()) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }
    if (!role || !["employer", "employee"].includes(role)) {
      return NextResponse.json({ error: "Role inválido" }, { status: 400 });
    }

    const admin = createAdminClient();

    // If user signed up via WhatsApp (synthetic email), update auth.users email
    // to the real email provided in onboarding.
    const hasSyntheticEmail = user.email?.endsWith("@pontocasa.app");
    if (hasSyntheticEmail && email?.trim()) {
      const { error: emailUpdateError } =
        await admin.auth.admin.updateUserById(user.id, {
          email: email.trim(),
          email_confirm: true,
        });

      if (emailUpdateError) {
        console.error("Auth email update error:", emailUpdateError);
        // Don't block onboarding if email update fails, just log
      }
    }

    const { error } = await admin
      .from("profiles")
      .update({
        name: name.trim(),
        cpf,
        phone: phone || null,
        email: email?.trim() || (hasSyntheticEmail ? null : user.email),
        role,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Onboarding update error:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado em outra conta" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Erro ao salvar" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("onboarding POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
