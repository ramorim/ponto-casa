import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE /api/account/delete
 *
 * LGPD — Right to Elimination (Art. 18, VI)
 *
 * Deletes the authenticated user's personal data. Time entries and audit
 * records are ANONYMIZED (not deleted) to comply with the 5-year labor
 * record retention requirement (CLT Art. 11, CF Art. 7 XXIX).
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Check if user is an employer with active employees
    const { data: employees } = await admin
      .from("profiles")
      .select("id")
      .eq("employer_id", user.id)
      .limit(1);

    if (employees && employees.length > 0) {
      return NextResponse.json(
        {
          error:
            "Você tem funcionários vinculados. Desvincule todos antes de excluir sua conta.",
        },
        { status: 409 }
      );
    }

    // 1. Anonymize time entries (keep records but remove personal link)
    //    This preserves labor records for the employer while removing PII
    await admin
      .from("time_entries")
      .update({ note: null, device_info: null })
      .eq("employee_id", user.id);

    // 2. Delete personal data tables
    await admin.from("user_devices").delete().eq("user_id", user.id);
    await admin.from("otp_codes").delete().eq("phone_or_email", user.email || "");
    await admin.from("employer_invites").delete().eq("employer_id", user.id);
    await admin
      .from("connection_requests")
      .delete()
      .or(`employee_id.eq.${user.id},employer_id.eq.${user.id}`);
    await admin.from("work_schedules").delete().eq("employee_id", user.id);

    // 3. Anonymize profile (keep for referential integrity with time_entries)
    await admin
      .from("profiles")
      .update({
        name: "Conta excluída",
        phone: null,
        email: null,
        cpf: null,
        is_active: false,
      })
      .eq("id", user.id);

    // 4. Delete auth user (invalidates all sessions)
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({
      message:
        "Conta excluída. Dados pessoais removidos. Registros de ponto anonimizados conforme legislação trabalhista.",
    });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 });
  }
}
