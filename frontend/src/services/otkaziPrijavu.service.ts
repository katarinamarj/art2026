import type { OtkaziPrijavuRequest, OtkaziPrijavuResponse } from "../models/otkaziPrijavu.model";

export async function otkaziPrijavu(
  payload: OtkaziPrijavuRequest
): Promise<OtkaziPrijavuResponse> {
  const response = await fetch("/api/otkazivanje", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? "Greska pri otkazivanju prijave");
  }

  return data as OtkaziPrijavuResponse;
}