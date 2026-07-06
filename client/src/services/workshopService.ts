import { unauthorized } from ".";
import { IWorkshop } from "../interfaces/workshop";
import { ResponseApi } from "../interfaces/responseApi";
import { URL_API } from "./constants";

/** Listado completo para el dashboard (requiere sesión). */
export const getWorkshops = async (): Promise<IWorkshop[]> => {
  try {
    const res = await fetch(`${URL_API}/workshops`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IWorkshop> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return (response.data as IWorkshop[]) || [];
  } catch (error) {
    throw error;
  }
};

/** Talleres activos de hoy en adelante (público: landing y reservas). */
export const getUpcomingWorkshops = async (): Promise<IWorkshop[]> => {
  try {
    const res = await fetch(`${URL_API}/workshops/upcoming`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const response: ResponseApi<IWorkshop> = await res.json();
    return (response.data as IWorkshop[]) || [];
  } catch (error) {
    console.error("Error loading workshops:", error);
    return [];
  }
};

export const createWorkshop = async (
  workshop: Omit<IWorkshop, "_id">,
): Promise<ResponseApi<IWorkshop>> => {
  const res = await fetch(`${URL_API}/workshops`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(workshop),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

export const updateWorkshop = async (
  workshop: IWorkshop,
): Promise<ResponseApi<IWorkshop>> => {
  const res = await fetch(`${URL_API}/workshops`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(workshop),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};

export const deleteWorkshop = async (
  id: string = "",
): Promise<ResponseApi<String>> => {
  const res = await fetch(`${URL_API}/workshops/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (res.status === 401) unauthorized();
  return res.json();
};
