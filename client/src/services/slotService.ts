import { unauthorized } from ".";
import { ResponseApi } from "../interfaces/responseApi";
import { IGenerateResult, ISlot, ISlotSummary } from "../interfaces/slot";
import { URL_API } from "./constants";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/** GET autenticado que devuelve el `data` de la respuesta, o el default. */
async function get<T>(path: string, fallback: T): Promise<T> {
  const res = await fetch(`${URL_API}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (res.status === 401) unauthorized();
  const response: ResponseApi<T> = await res.json();
  if (!res.ok) throw new Error(response.message || "Error de conexión");
  return (response.data as T) ?? fallback;
}

/**
 * Genera la disponibilidad para reservar. Con `dryRun` devuelve solo la
 * previsualización, sin escribir nada.
 */
export const generateSlots = async (params: {
  from: string;
  to: string;
  weekdays: number[];
  blocks: {
    timeStart: string;
    timeEnd: string;
    requiresDeposit: boolean;
  }[];
  dryRun?: boolean;
}): Promise<ResponseApi<IGenerateResult>> => {
  const res = await fetch(`${URL_API}/slots/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

/**
 * Endpoint público: las fechas que todavía tienen lugar para reservar.
 * `enforced` en false significa que la compañía no publicó agenda todavía y
 * el calendario no debe bloquear ninguna fecha.
 */
export const getAvailableDates = async (
  from: string,
  to: string
): Promise<{ enforced: boolean; dates: string[] }> => {
  try {
    const query = new URLSearchParams({ from, to });
    const res = await fetch(
      `${URL_API}/slots/available-dates?${query.toString()}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    const response: ResponseApi<{ enforced: boolean; dates: string[] }> =
      await res.json();
    const data = response.data as { enforced: boolean; dates: string[] };
    return data || { enforced: false, dates: [] };
  } catch (error) {
    // Ante un fallo de red no bloqueamos el calendario.
    console.error("Error loading available dates:", error);
    return { enforced: false, dates: [] };
  }
};

/** Disponibilidad de un día con su ocupación, incluidas las cerradas. */
export const getSlotsByDate = async (
  date: string,
  unitBusiness?: string
): Promise<ISlot[]> => {
  const query = new URLSearchParams({ date });
  if (unitBusiness) query.set("unitBusiness", unitBusiness);
  return get<ISlot[]>(`/slots?${query.toString()}`, []);
};

/** Hasta dónde llega la disponibilidad publicada y con qué composición. */
export const getSlotSummary = async (
  from: string,
  to: string
): Promise<ISlotSummary | null> => {
  const query = new URLSearchParams({ from, to });
  return get<ISlotSummary | null>(`/slots/summary?${query.toString()}`, null);
};

/** Abre o cierra una disponibilidad sin tocar sus reservas. */
export const setSlotStatus = async (
  id: string,
  status: "open" | "closed",
  reason?: string
): Promise<ResponseApi<ISlot>> => {
  const res = await fetch(`${URL_API}/slots/${id}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status, reason }),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

/**
 * Elimina las disponibilidades seleccionadas. Las que tienen reservas vuelven
 * en `data.blocked` en vez de hacer fallar toda la operación.
 */
export const deleteSlots = async (
  ids: string[]
): Promise<
  ResponseApi<{
    deleted: number;
    blocked: { timeStart: string; reason: string }[];
  }>
> => {
  const res = await fetch(`${URL_API}/slots/bulk-delete`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ids }),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};
