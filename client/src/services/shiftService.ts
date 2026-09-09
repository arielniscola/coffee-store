import { ResponseApi } from "../interfaces/responseApi";
import { IShift } from "../interfaces/shift";
import { URL_API } from "./constants";
import { unauthorized } from ".";

export const getShifts = async (date: string, unitBusiness?: string) => {
  try {
    const params = new URLSearchParams({ date });
    if (unitBusiness) params.set("unitBusiness", unitBusiness);
    const res = await fetch(
      `${URL_API}/shifts?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IShift> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getShiftsRange = async (
  dateFrom?: string,
  dateTo?: string,
  unitBusiness?: string,
) => {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (unitBusiness) params.set("unitBusiness", unitBusiness);
    const res = await fetch(`${URL_API}/shifts?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IShift> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createShift = async (shift: Partial<IShift>) => {
  try {
    const res = await fetch(`${URL_API}/shifts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(shift),
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<String> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateShift = async (shift: Partial<IShift>) => {
  try {
    const res = await fetch(`${URL_API}/shifts`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(shift),
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<String> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response;
  } catch (error) {
    throw error;
  }
};
export const deleteShift = async (id: string = "") => {
  try {
    const res = await fetch(`${URL_API}/shifts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<String> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response;
  } catch (error) {
    throw error;
  }
};

/** Filtros del tablero de estadísticas. Los comparten stats y exportación. */
export interface StatisticsFilters {
  /** Inicio del rango, YYYY-MM-DD (inclusive). */
  from: string;
  /** Fin del rango, YYYY-MM-DD (inclusive). */
  to: string;
  /** "linked" = con pago de MP asociado; "unlinked" = sin vincular. */
  linked?: "all" | "linked" | "unlinked";
}

const statisticsParams = (filters: StatisticsFilters) => {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.linked && filters.linked !== "all")
    params.set("linked", filters.linked);
  return params;
};

export const getStatistics = async (filters: StatisticsFilters) => {
  try {
    const res = await fetch(
      `${URL_API}/shifts/statistics?${statisticsParams(filters).toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (res.status === 401) unauthorized();
    const response: ResponseApi<any> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Descarga el Excel de turnos del rango/filtro indicado. La API responde un
 * binario, así que hay que forzar la descarga a mano en vez de navegar a la
 * URL: el endpoint pide el token en el header y un <a href> no lo manda.
 */
export const downloadShiftsExcel = async (filters: StatisticsFilters) => {
  const res = await fetch(
    `${URL_API}/shifts/export?${statisticsParams(filters).toString()}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    },
  );
  if (res.status === 401) return unauthorized();
  if (!res.ok) {
    // El error sí viene como JSON.
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "No se pudo generar el Excel");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `turnos_${filters.from}_${filters.to}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
export const checkoutShift = async (
  shift: Partial<IShift>,
): Promise<{
  ack: number;
  shiftId?: string;
  requiresPayment?: boolean;
  paymentLink?: string | null;
  message?: string;
}> => {
  const res = await fetch(`${URL_API}/shifts/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(shift),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

export interface ShiftPaymentSummary {
  client?: string;
  date?: string;
  timeStart?: string;
  peopleQty?: number;
  adultsQty?: number;
  childrenQty?: number;
  babiesQty?: number;
  price?: number;
  paymentLink?: string;
}

export const getShiftPaymentStatus = async (
  shiftId: string,
  paymentId?: string,
): Promise<{
  ack: number;
  status?: string;
  paymentStatus?: string;
  paidAt?: string;
  shift?: ShiftPaymentSummary;
}> => {
  const qs = paymentId ? `?payment_id=${encodeURIComponent(paymentId)}` : "";
  const res = await fetch(
    `${URL_API}/shifts/${shiftId}/payment-status${qs}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );
  if (res.status === 401) unauthorized();
  return res.json();
};

/**
 * Pide un checkout nuevo para una reserva que no llegó a pagarse. No sirve
 * reusar el link viejo: la preferencia de Mercado Pago vence a los 15 minutos.
 */
export const retryShiftPayment = async (
  shiftId: string,
): Promise<{
  ack: number;
  paymentLink?: string;
  alreadyPaid?: boolean;
  message?: string;
}> => {
  const res = await fetch(`${URL_API}/shifts/${shiftId}/retry-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

export const getClosedDates = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${URL_API}/shifts/closed-dates`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<string> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return (response.data as string[]) || [];
  } catch (error) {
    throw error;
  }
};

export const getAvailableShifts = async (date: string) => {
  try {
    /** Configurar fecha como principio de semana */
    const res = await fetch(`${URL_API}/shifts/availables?date=${date}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (res.status === 401) unauthorized();
    const response: ResponseApi<any> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
