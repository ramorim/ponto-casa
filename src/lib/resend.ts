const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const RESEND_FROM =
  process.env.RESEND_FROM || "Ponto Casa <onboarding@resend.dev>";

export async function sendEmailOtp(email: string, code: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [email],
      subject: `Seu código de acesso: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
          <h2 style="font-size: 20px; margin: 0 0 8px;">Ponto Casa</h2>
          <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Seu código de acesso:</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px; margin: 0;">
            Este código expira em 5 minutos. Não compartilhe com ninguém.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error (${response.status}): ${body}`);
  }

  return response.json();
}
