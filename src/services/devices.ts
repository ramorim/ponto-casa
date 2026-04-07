import { createClient } from "@/lib/supabase/client";

const DEVICE_ID_KEY = "ponto-casa-device-id";

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

function detectDeviceInfo(): {
  deviceName: string;
  deviceType: string;
  browser: string;
} {
  const ua = navigator.userAgent;

  let deviceType = "desktop";
  if (/iPad|tablet/i.test(ua)) deviceType = "tablet";
  else if (/iPhone|Android|Mobile/i.test(ua)) deviceType = "mobile";

  let deviceName = "Dispositivo";
  if (/iPhone/i.test(ua)) deviceName = "iPhone";
  else if (/iPad/i.test(ua)) deviceName = "iPad";
  else if (/Samsung/i.test(ua)) deviceName = "Samsung";
  else if (/Pixel/i.test(ua)) deviceName = "Pixel";
  else if (/Android/i.test(ua)) deviceName = "Android";
  else if (/Macintosh/i.test(ua)) deviceName = "Mac";
  else if (/Windows/i.test(ua)) deviceName = "Windows";
  else if (/Linux/i.test(ua)) deviceName = "Linux";

  let browser = "Navegador";
  if (/CriOS/i.test(ua)) browser = "Chrome";
  else if (/FxiOS/i.test(ua)) browser = "Firefox";
  else if (/EdgiOS|Edg\//i.test(ua)) browser = "Edge";
  else if (/OPiOS|OPR\//i.test(ua)) browser = "Opera";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";

  return {
    deviceName: `${deviceName} - ${browser}`,
    deviceType,
    browser,
  };
}

export async function registerDevice() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;

  const { deviceName, deviceType, browser } = detectDeviceInfo();

  await supabase.from("user_devices").upsert(
    {
      user_id: user.id,
      device_id: deviceId,
      device_name: deviceName,
      device_type: deviceType,
      browser,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" }
  );
}

export async function updateLastActive() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const deviceId = getOrCreateDeviceId();
  if (!deviceId) return;

  await supabase
    .from("user_devices")
    .update({ last_active_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("device_id", deviceId);
}

export async function getUserDevices() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_devices")
    .select("*")
    .eq("user_id", user.id)
    .order("last_active_at", { ascending: false });

  return data || [];
}

export async function removeDevice(deviceId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_devices")
    .delete()
    .eq("user_id", user.id)
    .eq("device_id", deviceId);
}

export function getCurrentDeviceId(): string {
  return getOrCreateDeviceId();
}

export function isCurrentDevice(deviceId: string): boolean {
  return getOrCreateDeviceId() === deviceId;
}
