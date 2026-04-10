import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_devices")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("last_active_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao listar dispositivos" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { device_id, device_name, device_type, browser } = body as {
    device_id?: string;
    device_name?: string;
    device_type?: string;
    browser?: string;
  };

  if (!device_id) {
    return NextResponse.json(
      { error: "device_id obrigatório" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("user_devices").upsert(
    {
      user_id: auth.user.id,
      device_id,
      device_name: device_name || "Dispositivo",
      device_type: device_type || "desktop",
      browser: browser || "",
      last_active_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "Erro ao registrar dispositivo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
