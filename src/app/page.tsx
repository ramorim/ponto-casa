export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Use admin to bypass RLS
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("onboarding_completed, role")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Employers don't punch — go to employees page
  if (profile.role === "employer") redirect("/funcionarios");

  redirect("/ponto");
}
