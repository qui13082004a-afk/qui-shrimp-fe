import api from "../lib/axios";

export const getProducts = async (params?: {
  page?: number;
  limit?: number;
  keyword?: string;
  id_danh_muc?: number | null;
}) => {
  const response = await api.get("/products", { params });
  return response.data;
};
export const getProductById = async (id: string | number) => {
  const response = await api.get(`/products/${id}`);
  return response.data; 
};