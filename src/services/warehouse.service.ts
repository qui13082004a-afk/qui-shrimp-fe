import api from "../lib/axios";
import type { Product } from "./product.service";
import type { DeparturePoint } from "./departurePoint.service";

export type WarehouseStatus = "hoat_dong" | "tam_ngung";

export interface Warehouse {
  id_kho_hang: number;
  ten_kho: string;
  id_diem_xuat_phat?: number | null;
  dia_chi?: string | null;
  vi_do?: string | number | null;
  kinh_do?: string | number | null;
  ghi_chu?: string | null;
  trang_thai: WarehouseStatus;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  CauHinhDiemXuatPhat?: DeparturePoint | null;
}

export interface ProductStock {
  id_ton_kho: number;
  id_san_pham: number;
  id_kho_hang: number;
  so_luong: number;
  ghi_chu?: string | null;
  KhoHang?: Warehouse;
  SanPham?: Product;
}

export interface WarehousePayload {
  ten_kho: string;
  id_diem_xuat_phat?: number | string;
  dia_chi?: string;
  vi_do?: string | number | null;
  kinh_do?: string | number | null;
  ghi_chu?: string;
  trang_thai?: WarehouseStatus;
}

export const warehouseService = {
  getWarehouses: async (params?: { activeOnly?: boolean }) => {
    const response = await api.get("/warehouses", {
      params: params?.activeOnly ? { activeOnly: "true" } : undefined,
    });
    return response.data;
  },

  createWarehouse: async (payload: WarehousePayload) => {
    const response = await api.post("/warehouses", payload);
    return response.data;
  },

  updateWarehouse: async (
    id: number | string,
    payload: Partial<WarehousePayload>
  ) => {
    const response = await api.put(`/warehouses/${id}`, payload);
    return response.data;
  },

  upsertProductStock: async (payload: {
    id_san_pham: number | string;
    id_kho_hang: number | string;
    so_luong: number | string;
    ghi_chu?: string;
  }) => {
    const response = await api.post("/warehouses/product-stocks", payload);
    return response.data;
  },

  getProductStocks: async (productId: number | string) => {
    const response = await api.get(`/warehouses/products/${productId}/stocks`);
    return response.data;
  },
};
