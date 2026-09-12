import { api } from "./client";

function toFormData(input) {
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
  const { data } = await api.get(
    "/auditoriums/viewAllAuditoriums",
  );
  return data.auditoriums;
}

export async function getSingleAuditorium(id) {
  const { data } = await api.get(
    `/auditoriums/viewAuditorium/${id}`,
  );
  return data.auditorium;
}

export async function createAuditorium(input) {
  const { data } = await api.post(
    "/auditoriums/createAuditorium",
    toFormData(input),
  );
  return data;
}

export async function updateAuditorium(id, input) {
  const { data } = await api.put(
    `/auditoriums/updateAuditorium/${id}`,
    toFormData(input),
  );
  return data;
}

export async function deleteAuditorium(id) {
  const { data } = await api.delete(`/auditoriums/deleteAuditorium/${id}`);
  return data;
}
