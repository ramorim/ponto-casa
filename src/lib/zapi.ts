const ZAPI_API_URL = process.env.ZAPI_API_URL || "https://api.z-api.io";
const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID!;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN!;

export async function sendWhatsAppOtp(phone: string, code: string) {
  const url = `${ZAPI_API_URL}/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: phone.replace(/\D/g, ""),
      message: `Seu código de acesso ao Ponto Casa é: *${code}*\n\nEle expira em 5 minutos. Não compartilhe este código.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Z-API error (${response.status}): ${body}`);
  }

  return response.json();
}
