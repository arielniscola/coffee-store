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

export const getStatistics = async (date: string) => {
  try {
    /** Configurar fecha como principio de semana */
    const res = await fetch(`${URL_API}/shifts/statistics?date=${date}`, {
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
