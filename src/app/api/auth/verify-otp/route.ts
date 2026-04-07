import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const supabase = createAdminClient();

    // Get the most recent non-expired, non-verified OTP
    const { data: otpRecords } = await supabase
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

    // Increment attempts
    await supabase
      .from("otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id);

    if (!verifyOtpCode(code, otpRecord.code_hash)) {
      return NextResponse.json(
        { error: "Código incorreto" },
        { status: 401 }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Create or sign in user via Supabase Auth
    // We use email format: {phone}@pontocasa.app for phone-based users
    const isPhone = /^\+?\d+$/.test(phoneOrEmail.replace(/\D/g, ""));
    const email = isPhone
      ? `${phoneOrEmail.replace(/\D/g, "")}@pontocasa.app`
      : phoneOrEmail;

    // Try to sign in first
    const { data: signInData, error: signInError } =
      await supabase.auth.admin.listUsers();

    const existingUser = signInData?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const password = crypto.randomUUID();
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            phone: isPhone ? phoneOrEmail : undefined,
          },
        });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Erro ao criar conta" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
    }

    // Generate a magic link token for the user (server-side session)
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      console.error("Error generating link:", linkError);
      return NextResponse.json(
        { error: "Erro ao autenticar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token_hash: linkData.properties.hashed_token,
      email,
      userId,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
