import { unauthorized } from ".";
import { ICompany } from "../interfaces/company";
import { ResponseApi } from "../interfaces/responseApi";
import { URL_API } from "./constants";

export const getCompany = async () => {
  try {
    const res = await fetch(`${URL_API}/company`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<ICompany> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateCompany = async (company: ICompany) => {
  try {
    const res = await fetch(`${URL_API}/company`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(company),
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
