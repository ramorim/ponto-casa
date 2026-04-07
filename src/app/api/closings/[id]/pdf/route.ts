import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { TimesheetDocument } from "@/lib/pdf/timesheet-template";
import React from "react";
import type { EventType } from "@/lib/time-entry-validation";

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

    // Fetch closing
    const { data: closing } = await supabase
      .from("monthly_closings")
      .select("*")
      .eq("id", id)
      .single();

    if (!closing) {
      return NextResponse.json({ error: "Fechamento não encontrado" }, { status: 404 });
    }

    // Verify access
    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("name, employer_id")
      .eq("id", closing.employee_id)
      .single();

    const isEmployee = closing.employee_id === user.id;
    const isEmployer = employeeProfile?.employer_id === user.id;

    if (!isEmployee && !isEmployer) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Get employer name
    const employerId = isEmployer ? user.id : employeeProfile?.employer_id;
    let employerName = "—";
    if (employerId) {
      const { data: emp } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", employerId)
        .single();
      employerName = emp?.name || "—";
    }

    // Fetch entries for the month
    const [year, monthNum] = closing.month_ref.split("-").map(Number);
    const startDate = new Date(`${closing.month_ref}-01T00:00:00-03:00`);
    const nextMonth =
      monthNum === 12
        ? `${year + 1}-01-01T00:00:00-03:00`
        : `${year}-${String(monthNum + 1).padStart(2, "0")}-01T00:00:00-03:00`;

    const { data: entries } = await supabase
      .from("time_entries")
      .select("event_type, timestamp_server")
      .eq("employee_id", closing.employee_id)
      .gte("timestamp_server", startDate.toISOString())
      .lt("timestamp_server", new Date(nextMonth).toISOString())
      .order("timestamp_server", { ascending: true });

    // Build day rows
    const byDate = new Map<string, Map<EventType, string>>();
    for (const entry of entries || []) {
      const spDate = new Date(entry.timestamp_server).toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      });
      const spTime = new Date(entry.timestamp_server).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      });
      if (!byDate.has(spDate)) byDate.set(spDate, new Map());
      byDate.get(spDate)!.set(entry.event_type as EventType, spTime);
    }

    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const weekdays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${closing.month_ref}-${String(day).padStart(2, "0")}`;
      const d = new Date(year, monthNum - 1, day);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayEntries = byDate.get(dateStr);
      const entrada = dayEntries?.get("entrada") ?? null;
      const saida_almoco = dayEntries?.get("saida_almoco") ?? null;
      const volta_almoco = dayEntries?.get("volta_almoco") ?? null;
      const saida = dayEntries?.get("saida") ?? null;

      let total: string | null = null;
      if (entrada && saida) {
        total = calcTotal(entrada, saida_almoco, volta_almoco, saida);
      }

      days.push({
        date: dateStr,
        dayLabel: `${String(day).padStart(2, "0")}/${String(monthNum).padStart(2, "0")} ${weekdays[dayOfWeek]}`,
        isWeekend,
        entrada,
        saida_almoco,
        volta_almoco,
        saida,
        total,
      });
    }

    const monthLabel = new Date(year, monthNum - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    const generatedAt = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    const doc = React.createElement(TimesheetDocument, {
      data: {
        monthLabel,
        employeeName: employeeProfile?.name || "—",
        employerName,
        days,
        totalHours: closing.total_hours,
        overtimeHours: closing.overtime_hours,
        delayMinutes: closing.delay_minutes,
        absenceDays: closing.absence_days,
        accepted: closing.employee_accepted,
        acceptedAt: closing.accepted_at,
        generatedAt,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any);

    const filename = `espelho-ponto-${closing.month_ref}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("closings/pdf error:", err);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}

function calcTotal(
  entrada: string,
  saida_almoco: string | null,
  volta_almoco: string | null,
  saida: string
): string {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let mins = toMin(saida) - toMin(entrada);
  if (saida_almoco && volta_almoco) {
    mins -= toMin(volta_almoco) - toMin(saida_almoco);
  }
  if (mins < 0) mins = 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? String(m).padStart(2, "0") : "00"}`;
}
