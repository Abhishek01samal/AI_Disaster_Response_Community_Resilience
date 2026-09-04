"use server";

import { authFetch } from "./api-client";

export async function submitSosAction(data: {
  emergencyType: string;
  peopleAffected: number;
  trapped: boolean;
  medicalHelpRequired: boolean;
  locationConsent: boolean;
  lat: number;
  lng: number;
  emergencyNote?: string;
}): Promise<{ success: boolean; error?: string; sosId?: string }> {
  const result = await authFetch<{ eventIds: string[]; sosId: string }>(
    "/sos",
    { method: "POST", body: JSON.stringify(data) }
  );
  if (!result.ok) {
    return { success: false, error: result.json.message ?? "SOS failed." };
  }
  return { success: true, sosId: result.json.data?.sosId };
}

export async function submitReportAction(data: {
  rawText: string;
  locationText?: string;
  lat?: number;
  lng?: number;
}): Promise<{ success: boolean; error?: string; reportId?: string }> {
  const result = await authFetch<{ eventIds: string[]; reportId: string }>(
    "/reports",
    { method: "POST", body: JSON.stringify(data) }
  );
  if (!result.ok) {
    return { success: false, error: result.json.message ?? "Report failed." };
  }
  return { success: true, reportId: result.json.data?.reportId };
}

export async function confirmMatchAction(
  matchId: string,
  decision: "CONFIRM" | "REJECT" = "CONFIRM"
): Promise<{ success: boolean; error?: string }> {
  const result = await authFetch("/matches/confirm", {
    method: "POST",
    body: JSON.stringify({ matchId, decision }),
  });
  if (!result.ok) {
    return { success: false, error: result.json.message ?? "Confirm failed." };
  }
  return { success: true };
}

export async function sendChatAction(
  message: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<{ success: boolean; reply?: string; error?: string }> {
  const result = await authFetch<{ reply: string; model: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
  if (!result.ok) {
    return { success: false, error: result.json.message ?? "Chat failed." };
  }
  return { success: true, reply: result.json.data?.reply };
}
