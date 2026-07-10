import React from "react";
import { AlertTriangle, ChevronRight, Ruler, Sprout, Waves } from "lucide-react";
import type { Pond } from "../Ponds/PondCard";

interface HomePondCardProps {
  pond: Pond;
  activeCrop: any;
  onActionClick: () => void;
}

export const HomePondCard: React.FC<HomePondCardProps> = ({
  pond,
  activeCrop,
  onActionClick,
}) => {
  const isWarning =
    pond.ten_ao.toLowerCase().includes("04") ||
    pond.ten_ao.toLowerCase().includes("cảnh báo");

  return (
    <div className={`home-pond-card ${isWarning ? "warning-border" : ""}`}>
      <div className="pond-card-top">
        <div className="pond-title-wrap">
          <span className={`pond-icon-box ${isWarning ? "danger" : activeCrop ? "active" : "empty"}`}>
            {isWarning ? <AlertTriangle size={18} /> : activeCrop ? <Waves size={18} /> : <Ruler size={18} />}
          </span>
          <div>
            <h4>{pond.ten_ao}</h4>
            <p>
              {activeCrop
                ? `Vụ nuôi: ${activeCrop.ten_vu_nuoi}`
                : `Diện tích: ${Number(pond.dien_tich).toLocaleString("vi-VN")} m²`}
            </p>
          </div>
        </div>

        {isWarning ? (
          <span className="home-badge badge-red">Cảnh báo</span>
        ) : activeCrop ? (
          <span className="home-badge badge-green">Đang nuôi</span>
        ) : (
          <span className="home-badge badge-gray">Trống</span>
        )}
      </div>

      <div className="pond-card-meta">
        <div>
          <span>Trạng thái</span>
          <strong>{isWarning ? "Cần kiểm tra" : activeCrop ? "Đang hoạt động" : "Chưa có vụ"}</strong>
        </div>
        <div>
          <span>Gợi ý</span>
          <strong>{activeCrop ? "Theo dõi thông số" : "Khai báo vụ mới"}</strong>
        </div>
      </div>

      {isWarning ? (
        <button onClick={onActionClick} className="btn-home-action danger-action">
          <AlertTriangle size={16} />
          Xử lý ngay
          <ChevronRight size={16} />
        </button>
      ) : activeCrop ? (
        <button onClick={onActionClick} className="btn-home-action">
          <Waves size={16} />
          Chi tiết thông số
          <ChevronRight size={16} />
        </button>
      ) : (
        <button onClick={onActionClick} className="btn-home-action filled">
          <Sprout size={16} />
          Khai báo vụ mới
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};
