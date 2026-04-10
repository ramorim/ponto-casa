import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { sendWhatsAppOtp } from "@/lib/zapi";
import { sendEmailOtp } from "@/lib/resend";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SENDS_PER_WINDOW = 3;

export async function POST(request: NextRequest) {
  try {
    const { phoneOrEmail, type } = await request.json();

    if (!phoneOrEmail || !type) {
      return NextResponse.json(
        { error: "phone_or_email e type são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["whatsapp", "email"].includes(type)) {
      return NextResponse.json(
        { error: "type deve ser 'whatsapp' ou 'email'" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Rate limiting
    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MS
    ).toISOString();

    const { count } = await admin
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone_or_email", phoneOrEmail)
      .gte("created_at", windowStart);

    if (count !== null && count >= MAX_SENDS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    // Generate and save OTP (same flow for email and WhatsApp)
    const code = generateOtpCode();
    const codeHash = hashOtpCode(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from("otp_codes").insert({
      phone_or_email: phoneOrEmail,
      code_hash: codeHash,
      type,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Error saving OTP:", insertError);
      return NextResponse.json(
        { error: "Erro ao gerar código" },
        { status: 500 }
      );
    }

    // Send OTP via the appropriate channel
    if (type === "whatsapp") {
      try {
        await sendWhatsAppOtp(phoneOrEmail, code);
      } catch (err) {
        console.error("Z-API send error:", err);
        return NextResponse.json(
          { error: "Erro ao enviar WhatsApp. Tente por email." },
          { status: 502 }
        );
      }
    } else {
      try {
        await sendEmailOtp(phoneOrEmail, code);
      } catch (err) {
        console.error("Resend send error:", err);
        return NextResponse.json(
          { error: "Erro ao enviar email. Tente novamente." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ message: "Código enviado", expiresAt });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
