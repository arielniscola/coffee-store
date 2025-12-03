import { unauthorized } from ".";
import { IPayment } from "../interfaces/payment";
import { ResponseApi } from "../interfaces/responseApi";
import { URL_API } from "./constants";

export const getPayments = async (date?: string) => {
  try {
    const res = await fetch(`${URL_API}/payments?date=${date ? date : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IPayment> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createPayment = async (pay: IPayment) => {
  try {
    const res = await fetch(`${URL_API}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(pay),
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

export const deletePayment = async (id: string = "") => {
  try {
    const res = await fetch(`${URL_API}/payments/${id}`, {
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
