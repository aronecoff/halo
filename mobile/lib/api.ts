import { supabase } from "./supabase";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || "https://app-eight-alpha-38.vercel.app/api";

export async function apiCall(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
