import React from "react";
export interface Pond {
  id_ao: number;
  id_nguoi_dung: number;
  ten_ao: string;
  dien_tich: number;
  dia_chi_ao?: string;
  loai_hinh_nuoi?: string;
  trang_thai_ao: "dang_hoat_dong" | "tam_ngung";
  ghi_chu?: string;
  id_tinh_thanh?: number | null;
  id_phuong_xa?: number | null;
  vi_do?: number | string | null;
  kinh_do?: number | string | null;
  TinhThanh?: {
    id_tinh_thanh: number;
    ma_tinh: string;
    ten_tinh: string;
  } | null;
  PhuongXa?: {
    id_phuong_xa: number;
    ma_xa: string;
    ten_xa: string;
    cap_xa: string;
  } | null;
  ngay_tao: string;
  co_vu_dang_nuoi?: boolean;
}

interface PondCardProps {
  pond: Pond;
  isActive: boolean;
  hasActiveCrop?: boolean;
  onClick: () => void;
}

export const PondCard: React.FC<PondCardProps> = ({
  pond,
  isActive,
  hasActiveCrop = false,
  onClick,
}) => {
  const isPaused = pond.trang_thai_ao === "tam_ngung";

  const badgeText = isPaused
    ? "TẠM NGƯNG"
    : hasActiveCrop
    ? "ĐANG NUÔI"
    : "AO TRỐNG";

  const badgeClass = isPaused
    ? "badge-pause"
    : hasActiveCrop
    ? "badge-green"
    : "badge-empty";

  return (
    <div
      onClick={onClick}
      className={`pond-card-item ${isActive ? "card-active" : ""}`}
    >
      <span className={`card-badge ${badgeClass}`}>{badgeText}</span>

      <h3 className="card-title">{pond.ten_ao}</h3>

      <p className="card-sub">
        {pond.loai_hinh_nuoi || "Chưa xác định loài"}
      </p>

      <p className="card-area">
        <i className="fa-solid fa-vector-square"></i> Diện tích:{" "}
        {Number(pond.dien_tich).toLocaleString()} m²
      </p>
    </div>
  );
};
