import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEventAllowed, getValidationErrorMessage } from "@/lib/time-entry-validation";
import type { EventType } from "@/lib/time-entry-validation";

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
    const { event_type, latitude, longitude, device_info, note } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: "event_type é obrigatório" },
        { status: 400 }
      );
    }

    const validTypes = ["entrada", "saida_almoco", "volta_almoco", "saida"];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json(
        { error: "event_type inválido" },
        { status: 400 }
      );
    }

    // Get today's last entry for flow validation
    const todayStart = getTodayStartUTC();
    const { data: todayEntries } = await supabase
      .from("time_entries")
      .select("event_type, timestamp_server")
      .eq("employee_id", user.id)
      .gte("timestamp_server", todayStart)
      .order("timestamp_server", { ascending: false })
      .limit(1);

    const lastEventType = (todayEntries?.[0]?.event_type as EventType) ?? null;

    if (!isEventAllowed(lastEventType, event_type as EventType)) {
      return NextResponse.json(
        { error: getValidationErrorMessage(lastEventType, event_type as EventType) },
        { status: 422 }
      );
    }

    // Insert the entry — timestamp_server uses DB default NOW()
    const { data: entry, error: insertError } = await supabase
      .from("time_entries")
      .insert({
        employee_id: user.id,
        event_type,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        device_info: device_info ?? null,
        note: note ?? null,
      })
      .select("id, event_type, timestamp_server")
      .single();

    if (insertError) {
      console.error("Error inserting time entry:", insertError);
      return NextResponse.json(
        { error: "Erro ao registrar ponto" },
        { status: 500 }
      );
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("time-entries POST error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function getTodayStartUTC(): string {
  // Use São Paulo timezone to determine "today"
  const now = new Date();
  const spFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const spDate = spFormatter.format(now); // YYYY-MM-DD
  // Convert SP midnight to UTC
  const spMidnight = new Date(`${spDate}T00:00:00-03:00`);
  return spMidnight.toISOString();
}
