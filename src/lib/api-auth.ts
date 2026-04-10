import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  role: "employer" | "employee" | null;
  employer_id: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
}

export interface AuthContext {
  user: User;
  profile: Profile | null;
}

/**
 * Authenticates the request via session cookie. Returns the user + profile,
 * or a NextResponse 401 if not authenticated.
 *
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user, profile } = auth;
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
}

/**
 * Like requireAuth but also requires the user to be an employer.
 */
export async function requireEmployer(): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.profile?.role !== "employer") {
    return NextResponse.json(
      { error: "Apenas empregadores podem acessar" },
      { status: 403 }
    );
  }
  return auth;
}

/**
 * Like requireAuth but also requires the user to be an employee.
 */
export async function requireEmployee(): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.profile?.role !== "employee") {
    return NextResponse.json(
      { error: "Apenas funcionários podem acessar" },
      { status: 403 }
    );
  }
  return auth;
}

/**
 * Verifies the current user is the employer of the given employee_id.
 */
export async function verifyEmployerOf(
  employerId: string,
  employeeId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("employer_id")
    .eq("id", employeeId)
    .single();
  return data?.employer_id === employerId;
}
