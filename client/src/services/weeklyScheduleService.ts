import { unauthorized } from ".";
import { ResponseApi } from "../interfaces/responseApi";
import { IWeeklySchedule } from "../interfaces/weeklySchedule";
import { URL_API } from "./constants";

export const getWeeklySchedule = async (): Promise<IWeeklySchedule | null> => {
  try {
    const res = await fetch(`${URL_API}/weekly-schedule`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (res.status === 401) unauthorized();
    const response: ResponseApi<IWeeklySchedule> = await res.json();
    if (!res.ok && typeof response.data == "string")
      throw new Error(response.data);
    return (response.data as IWeeklySchedule) || null;
  } catch (error) {
    throw error;
  }
};

export const updateWeeklySchedule = async (
  schedule: IWeeklySchedule,
): Promise<ResponseApi<IWeeklySchedule>> => {
  const res = await fetch(`${URL_API}/weekly-schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(schedule),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};
