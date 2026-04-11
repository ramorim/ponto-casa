import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyOtpCode } from "@/lib/otp";

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { phoneOrEmail, code } = await request.json();

    if (!phoneOrEmail || !code) {
      return NextResponse.json(
        { error: "phone_or_email e code são obrigatórios" },
        { status: 400 }
      );
    }

    // ── Unified flow: custom OTP verification for both email and WhatsApp ──
    const admin = createAdminClient();

    const { data: otpRecords } = await admin
      .from("otp_codes")
      .select("*")
      .eq("phone_or_email", phoneOrEmail)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    const otpRecord = otpRecords?.[0];

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Código expirado ou não encontrado. Solicite um novo." },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Muitas tentativas incorretas. Solicite um novo código." },
        { status: 429 }
      );
    }

    await admin
      .from("otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id);

    if (!verifyOtpCode(code, otpRecord.code_hash)) {
      return NextResponse.json({ error: "Código incorreto" }, { status: 401 });
    }

    await admin
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Determine the auth email to use for login.
    // Priority: if a profile already exists with this phone or email, reuse that
    // user (so the same person logging in via WhatsApp and Email gets the same account).
    const isEmail = phoneOrEmail.includes("@");
    const phoneDigits = isEmail ? null : phoneOrEmail.replace(/\D/g, "");
    let authEmail: string;

    // Check if there's an existing profile with this phone or email
    let existingProfile: { id: string } | null = null;

    if (isEmail) {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("email", phoneOrEmail)
        .maybeSingle();
      existingProfile = data;
    } else {
      // Try matching by phone (with or without country code)
      const { data } = await admin
        .from("profiles")
        .select("id")
        .or(`phone.eq.${phoneDigits},phone.eq.${phoneDigits!.replace(/^55/, "")}`)
        .maybeSingle();
      existingProfile = data;
    }

    if (existingProfile) {
      // Reuse the existing user — get their auth email
      const { data: existingAuthUser } =
        await admin.auth.admin.getUserById(existingProfile.id);
      authEmail = existingAuthUser?.user?.email || (isEmail
        ? phoneOrEmail
        : `${phoneDigits}@pontocasa.app`);

      // Update the profile phone if logging in via WhatsApp and phone wasn't set
      if (!isEmail && phoneDigits) {
        await admin
          .from("profiles")
          .update({ phone: phoneDigits })
          .eq("id", existingProfile.id)
          .is("phone", null);
      }
    } else {
      // No existing profile — default auth email
      authEmail = isEmail
        ? phoneOrEmail
        : `${phoneDigits}@pontocasa.app`;

      // Find or create auth user
      const { data: usersList } = await admin.auth.admin.listUsers();
      const existingUser = usersList?.users?.find((u) => u.email === authEmail);

      if (!existingUser) {
        const { error: createError } = await admin.auth.admin.createUser({
          email: authEmail,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            phone: isEmail ? undefined : phoneOrEmail,
          },
        });

        if (createError) {
          console.error("Error creating user:", createError);
          return NextResponse.json(
            { error: "Erro ao criar conta" },
            { status: 500 }
          );
        }
      }
    }

    // Generate magic link and verify on server to set session cookies
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

    if (linkError || !linkData) {
      console.error("Error generating link:", linkError);
      return NextResponse.json(
        { error: "Erro ao autenticar" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError) {
      console.error("verifyOtp error:", verifyError);
      return NextResponse.json(
        { error: "Erro ao estabelecer sessão" },
        { status: 500 }
      );
    }

    return NextResponse.json({ authenticated: true });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
