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