import type {
  KreirajPrijavuRequest,
  KreirajPrijavuResponse,
} from "../types/prijava.types";

export async function createPrijava(
  payload: KreirajPrijavuRequest
): Promise<KreirajPrijavuResponse> {
  const response = await fetch("/api/prijave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? "Greska pri kreiranju prijave");
  }

  return data as KreirajPrijavuResponse;
}