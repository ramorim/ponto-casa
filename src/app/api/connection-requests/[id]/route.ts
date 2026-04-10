import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEmployer } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployer();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json();
  const { action } = body as { action?: "accepted" | "rejected" };

  if (!action || !["accepted", "rejected"].includes(action)) {
    return NextResponse.json(
      { error: "action deve ser 'accepted' ou 'rejected'" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify this request belongs to the employer
  const { data: req } = await admin
    .from("connection_requests")
    .select("employee_id, employer_id")
    .eq("id", id)
    .single();

  if (!req || req.employer_id !== auth.user.id) {
    return NextResponse.json(
      { error: "Solicitação não encontrada" },
      { status: 404 }
    );
  }

  if (action === "accepted") {
    // Link employee to employer
    await admin
      .from("profiles")
      .update({ employer_id: auth.user.id })
      .eq("id", req.employee_id);
  }

  await admin
    .from("connection_requests")
    .update({ status: action })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
