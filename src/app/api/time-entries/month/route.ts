import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month"); // YYYY-MM
    const employeeId = searchParams.get("employee_id"); // optional, for employers

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Parâmetro month obrigatório no formato YYYY-MM" },
        { status: 400 }
      );
    }

    // Determine which employee to query
    let targetEmployeeId = user.id;

    if (employeeId && employeeId !== user.id) {
      // Verify the requester is the employer of this employee
      const { data: employeeProfile } = await supabase
        .from("profiles")
        .select("employer_id")
        .eq("id", employeeId)
        .single();

      if (!employeeProfile || employeeProfile.employer_id !== user.id) {
        return NextResponse.json(
          { error: "Sem permissão para ver registros deste funcionário" },
          { status: 403 }
        );
      }
      targetEmployeeId = employeeId;
    }

    // Calculate month range in São Paulo timezone
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = new Date(`${month}-01T00:00:00-03:00`);
    const endDate = new Date(year, monthNum, 1); // first day of next month
    const endDateSP = new Date(
      endDate.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    );
    // Adjust to SP timezone
    const endISO = new Date(`${year}-${String(monthNum + 1).padStart(2, "0")}-01T00:00:00-03:00`);
    // Handle December → January
    const nextMonth = monthNum === 12
      ? `${year + 1}-01-01T00:00:00-03:00`
      : `${year}-${String(monthNum + 1).padStart(2, "0")}-01T00:00:00-03:00`;

    const { data: entries, error } = await supabase
      .from("time_entries")
      .select("id, event_type, timestamp_server, note")
      .eq("employee_id", targetEmployeeId)
      .gte("timestamp_server", startDate.toISOString())
      .lt("timestamp_server", new Date(nextMonth).toISOString())
      .order("timestamp_server", { ascending: true });

    if (error) {
      console.error("Error fetching month entries:", error);
      return NextResponse.json(
        { error: "Erro ao buscar registros" },
        { status: 500 }
      );
    }

    return NextResponse.json(entries || []);
  } catch (err) {
    console.error("time-entries/month GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
