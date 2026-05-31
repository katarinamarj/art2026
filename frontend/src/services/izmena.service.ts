import type {
  IzmeniPrijavuRequest,
  IzmeniPrijavuResponse,
} from "../types/prijava.types";

export async function izmeniPrijavu(
  payload: IzmeniPrijavuRequest
): Promise<IzmeniPrijavuResponse> {
  const response = await fetch("/api/izmena", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ?? "Greška pri izmeni prijave"
    );
  }

  return data;
}