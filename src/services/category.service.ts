import api from "../lib/axios";

export type CategoryStatus = "hoat_dong" | "an";

export interface Category {
  id_danh_muc: number;
  ten_danh_muc: string;
  mo_ta?: string | null;
  anh_danh_muc?: string | null;
  trang_thai: CategoryStatus;
}

export interface CategoryPayload {
  ten_danh_muc: string;
  mo_ta?: string;
  anh_danh_muc?: string;
  trang_thai?: CategoryStatus;
}

export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const categoryService = {
  getActiveCategories: getCategories,

  getAdminCategories: async () => {
    const response = await api.get("/categories/admin");
    return response.data;
  },

  createCategory: async (payload: CategoryPayload) => {
    const response = await api.post("/categories", payload);
    return response.data;
  },

  updateCategory: async (id: number | string, payload: Partial<CategoryPayload>) => {
    const response = await api.put(`/categories/${id}`, payload);
    return response.data;
  },

  deleteCategory: async (id: number | string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
