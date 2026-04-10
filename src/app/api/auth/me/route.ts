import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    user: { id: auth.user.id, email: auth.user.email },
    profile: auth.profile,
  });
}
