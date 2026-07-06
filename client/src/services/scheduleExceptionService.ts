import { unauthorized } from ".";
import { IScheduleException } from "../interfaces/scheduleException";
import { ResponseApi } from "../interfaces/responseApi";
import { URL_API } from "./constants";

/**
 * Aperturas especiales vigentes (público): fechas en las que se abren horarios
 * especiales. No requiere sesión.
 */
export const getPublicScheduleExceptions = async (): Promise<
  IScheduleException[]
> => {
  try {
    const res = await fetch(`${URL_API}/schedule-exceptions/public`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const response: ResponseApi<IScheduleException> = await res.json();
    return (response.data as IScheduleException[]) || [];
  } catch (error) {
    console.error("Error loading special dates:", error);
    return [];
  }
};

export const getScheduleExceptions = async (): Promise<IScheduleException[]> => {
  try {
    const res = await fetch(`${URL_API}/schedule-exceptions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IScheduleException> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return (response.data as IScheduleException[]) || [];
  } catch (error) {
    throw error;
  }
};

export const createScheduleException = async (
  exception: Omit<IScheduleException, "_id">,
): Promise<ResponseApi<IScheduleException> & { affectedReservations?: number }> => {
  const res = await fetch(`${URL_API}/schedule-exceptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(exception),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

export const deleteScheduleException = async (
  id: string = "",
): Promise<ResponseApi<String>> => {
  const res = await fetch(`${URL_API}/schedule-exceptions/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (res.status === 401) unauthorized();
  return res.json();
};
