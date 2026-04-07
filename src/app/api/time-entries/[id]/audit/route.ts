import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: audits, error } = await supabase
      .from("time_entry_audit")
      .select("id, field_changed, previous_value, new_value, changed_by, reason, changed_at")
      .eq("entry_id", id)
      .order("changed_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit:", error);
      return NextResponse.json(
        { error: "Erro ao buscar histórico de alterações" },
        { status: 500 }
      );
    }

    // Enrich with changer name
    if (audits && audits.length > 0) {
      const changerIds = [...new Set(audits.map((a) => a.changed_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", changerIds);

      const nameMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

      const enriched = audits.map((a) => ({
        ...a,
        changed_by_name: nameMap.get(a.changed_by) || "Desconhecido",
      }));

      return NextResponse.json(enriched);
    }

    return NextResponse.json(audits || []);
  } catch (err) {
    console.error("time-entry audit GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
