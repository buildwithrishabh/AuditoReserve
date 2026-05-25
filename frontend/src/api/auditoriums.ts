import { api } from "./client";
import type { Auditorium } from "../types";

export type AuditoriumInput = {
  name: string;
  capacity: number;
  amenities: string[];
  basePrice: number;
  description: string;
  images?: FileList | File[];
};

function toFormData(input: AuditoriumInput) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("capacity", String(input.capacity));
  formData.append("amenities", input.amenities.join(","));
  formData.append("basePrice", String(input.basePrice));
  formData.append("description", input.description);

  Array.from(input.images || []).forEach((file) => {
    formData.append("images", file);
  });

  return formData;
}

export async function getAllAuditoriums() {
  const { data } = await api.get<{ success: boolean; total: number; auditoriums: Auditorium[] }>(
    "/auditoriums/viewAllAuditoriums",
  );
  return data.auditoriums;
}

export async function getSingleAuditorium(id: string) {
  const { data } = await api.get<{ success: boolean; auditorium: Auditorium }>(
    `/auditoriums/viewAuditorium/${id}`,
  );
  return data.auditorium;
}

export async function createAuditorium(input: AuditoriumInput) {
  const { data } = await api.post<{ auditorium: Auditorium; message: string }>(
    "/auditoriums/createAuditorium",
    toFormData(input),
  );
  return data;
}

export async function updateAuditorium(id: string, input: AuditoriumInput) {
  const { data } = await api.put<{ auditorium: Auditorium; message: string }>(
    `/auditoriums/updateAuditorium/${id}`,
    toFormData(input),
  );
  return data;
}

export async function deleteAuditorium(id: string) {
  const { data } = await api.delete<{ message: string }>(`/auditoriums/deleteAuditorium/${id}`);
  return data;
}
