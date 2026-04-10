const ZAPI_API_URL = process.env.ZAPI_API_URL || "https://api.z-api.io";
const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID!;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN!;
const ZAPI_SECURITY_TOKEN = process.env.ZAPI_SECURITY_TOKEN || "";

export async function sendWhatsAppOtp(phone: string, code: string) {
  const url = `${ZAPI_API_URL}/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ZAPI_SECURITY_TOKEN) {
    headers["Client-Token"] = ZAPI_SECURITY_TOKEN;
  }

  // Ensure phone has country code (55 for Brazil)
  let phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length === 11 && !phoneDigits.startsWith("55")) {
    phoneDigits = "55" + phoneDigits;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      phone: phoneDigits,
      message: `Seu código de acesso ao Ponto Casa é: *${code}*\n\nEle expira em 5 minutos. Não compartilhe este código.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Z-API error (${response.status}): ${body}`);
  }

  return response.json();
}
