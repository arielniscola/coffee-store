import { IAuthResponse, IUser } from "../interfaces/user";
import { URL_API } from "./constants";

export const login = async (user: IUser) => {
  try {
    const res = await fetch(`${URL_API}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    const response: IAuthResponse = await res.json();
    if (!res.ok && typeof response.token == "string")
      throw new Error(response.error);
    return response;
  } catch (error) {
    throw error;
  }
};
