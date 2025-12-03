import { unauthorized } from ".";
import { ResponseApi } from "../interfaces/responseApi";
import { IUnitBusiness } from "../interfaces/unitBusiness";
import { URL_API } from "./constants";

export const getUnitBusiness = async (active: boolean) => {
  try {
    const res = await fetch(`${URL_API}/unitBusiness?active=${active}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IUnitBusiness> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createUnitBusiness = async (
  unitBusiness: Omit<IUnitBusiness, "_id">
) => {
  try {
    const res = await fetch(`${URL_API}/unitBusiness`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(unitBusiness),
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

export const updateUnitBusiness = async (
  unitBusiness: Partial<IUnitBusiness>
) => {
  try {
    const res = await fetch(`${URL_API}/unitBusiness`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(unitBusiness),
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
export const deleteUnitBusiness = async (id: string = "") => {
  try {
    const res = await fetch(`${URL_API}/unitBusiness/${id}`, {
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
