import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const todayStart = getTodayStartUTC();

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("id, event_type, timestamp_server, note")
      .eq("employee_id", user.id)
      .gte("timestamp_server", todayStart)
      .order("timestamp_server", { ascending: true });

    if (error) {
      console.error("Error fetching today entries:", error);
      return NextResponse.json(
        { error: "Erro ao buscar registros" },
        { status: 500 }
      );
    }

    return NextResponse.json(entries || []);
  } catch (err) {
    console.error("time-entries/today GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function getTodayStartUTC(): string {
  const now = new Date();
  const spFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const spDate = spFormatter.format(now);
  const spMidnight = new Date(`${spDate}T00:00:00-03:00`);
  return spMidnight.toISOString();
}
