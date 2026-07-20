import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "rafiqq_auth_token";

export async function sendVoiceText(text: string, language: "en" | "ar") {
  const res = await fetch(`${API_BASE}/api/voice/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(`Voice request failed: ${res.status}`);
  return res.json() as Promise<{ reply: string; error?: string }>;
}

export async function fetchSiteGuide(siteId: string) {
  const res = await fetch(`${API_BASE}/api/guide/site/${siteId}`);
  if (!res.ok) throw new Error(`Guide request failed: ${res.status}`);
  return res.json() as Promise<{ en: string; ar: string } & { error?: string }>;
}

export async function fetchRoute(from: string, to: string) {
  const res = await fetch(`${API_BASE}/api/navigation/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to }),
  });
  return res.json();
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: number;
};

async function authRequest(path: string, body: unknown): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export function signup(email: string, password: string) {
  return authRequest("/signup", { email, password });
}

export function login(email: string, password: string) {
  return authRequest("/login", { email, password });
}

export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = await getStoredToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return null;
  }
  const data = await res.json();
  return data.user as AuthUser;
}

export async function updateProfile(patch: Partial<Pick<AuthUser, "name" | "phone" | "emergencyContactName" | "emergencyContactPhone">>) {
  const token = await getStoredToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data.user as AuthUser;
}

export { API_BASE };
