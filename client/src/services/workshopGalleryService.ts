import { unauthorized } from ".";
import { ResponseApi } from "../interfaces/responseApi";
import { URL_API } from "./constants";

/** Imágenes de la galería general de talleres (público). */
export const getWorkshopGallery = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${URL_API}/workshop-gallery`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const response: ResponseApi<string> = await res.json();
    return (response.data as string[]) || [];
  } catch (error) {
    console.error("Error loading workshop gallery:", error);
    return [];
  }
};

/** Reemplaza la galería general de talleres (requiere sesión). */
export const updateWorkshopGallery = async (
  images: string[],
): Promise<ResponseApi<string[]>> => {
  const res = await fetch(`${URL_API}/workshop-gallery`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ images }),
  });
  if (res.status === 401) unauthorized();
  return res.json();
};
