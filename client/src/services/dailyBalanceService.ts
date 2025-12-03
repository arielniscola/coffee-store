import { unauthorized } from ".";
import {
  DailyBalanceResponse,
  ICloseDailyBalanceResponse,
  IDailyBalanceIds,
} from "../interfaces/dailyBalance";
import { ResponseApi } from "../interfaces/responseApi";
import { IWithdrawal } from "../interfaces/withdrawal";
import { URL_API } from "./constants";

export const getDailyBalance = async (date?: string) => {
  try {
    const res = await fetch(
      `${URL_API}/daily-balance?date=${date ? date : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (res.status === 401) unauthorized();
    const response: ResponseApi<DailyBalanceResponse> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getClosedBalance = async (id: number) => {
  try {
    const res = await fetch(`${URL_API}/daily-balance/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<ICloseDailyBalanceResponse> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getClosedBalances = async () => {
  try {
    const res = await fetch(`${URL_API}/daily-balance/closes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IDailyBalanceIds> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const closeBalance = async (
  realAmountCash: number,
  realAmountTransfer: number
) => {
  try {
    const res = await fetch(`${URL_API}/daily-balance/close`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ realAmountCash, realAmountTransfer }),
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
export const createWithdrawal = async (withdrawal: IWithdrawal) => {
  try {
    const res = await fetch(`${URL_API}/daily-balance/withdrawal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(withdrawal),
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
