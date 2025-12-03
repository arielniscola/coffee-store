import { unauthorized } from ".";
import { IClient } from "../interfaces/client";
import { IMovement } from "../interfaces/movement";
import { ResponseApi } from "../interfaces/responseApi";
import { URL_API } from "./constants";

export const getClients = async () => {
  try {
    const res = await fetch(`${URL_API}/clients?`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IClient> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createClient = async (client: IClient) => {
  try {
    const res = await fetch(`${URL_API}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(client),
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

export const updateClient = async (client: IClient) => {
  try {
    const res = await fetch(`${URL_API}/clients`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(client),
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

export const getMovementsClient = async (id: string = "", page: number) => {
  try {
    const res = await fetch(`${URL_API}/clients/${id}?page=${page}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IMovement> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return { movs: response.data, total: response.total };
  } catch (error) {
    throw error;
  }
};
export const deleteClient = async (id: string = "") => {
  try {
    const res = await fetch(`${URL_API}/clients/${id}`, {
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
