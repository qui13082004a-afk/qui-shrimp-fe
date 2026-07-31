import React from "react";

interface CropSeasonFormData {
  ten_vu_nuoi: string;
  ngay_tha_giong: string;
  so_luong_giong: number;
  ngay_thu_hoach_du_kien: string;
  ghi_chu: string;
}

interface CropSeasonModalProps {
  isOpen: boolean;
  pondName: string;
  formData: CropSeasonFormData;
  onChange: (data: CropSeasonFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}

export const CropSeasonModal: React.FC<
  CropSeasonModalProps
> = ({
  isOpen,
  pondName,
  formData,
  onChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" lang="vi">
      <div className="modal-box">
        <h3>
          <i
            className="fa-solid fa-seedling"
            style={{ color: "#16a34a" }}
          />{" "}
          Khởi tạo vụ nuôi mới
        </h3>

        <p className="modal-subtitle">
          Thực hiện thả con giống vụ mới cho ao{" "}
          <strong>{pondName}</strong> để kích hoạt theo dõi nhật ký.
        </p>

        <form onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <label>Tên vụ nuôi trồng *</label>

            <input
              type="text"
              value={formData.ten_vu_nuoi}
              onChange={(event) =>
                onChange({
                  ...formData,
                  ten_vu_nuoi: event.target.value,
                })
              }
              placeholder="Ví dụ: Vụ Thu Đông 2026"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Ngày thả giống thực tế *</label>

              <input
                type="date"
                lang="vi"
                value={formData.ngay_tha_giong}
                onChange={(event) =>
                  onChange({
                    ...formData,
                    ngay_tha_giong: event.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Số lượng con giống (con) *</label>

              <input
                type="number"
                value={formData.so_luong_giong || ""}
                onChange={(event) =>
                  onChange({
                    ...formData,
                    so_luong_giong: Number(event.target.value),
                  })
                }
                placeholder="Ví dụ: 150000"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Ngày thu hoạch dự kiến</label>

            <input
              type="date"
              lang="vi"
              value={formData.ngay_thu_hoach_du_kien}
              onChange={(event) =>
                onChange({
                  ...formData,
                  ngay_thu_hoach_du_kien: event.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Ghi chú vụ nuôi</label>

            <input
              type="text"
              value={formData.ghi_chu}
              onChange={(event) =>
                onChange({
                  ...formData,
                  ghi_chu: event.target.value,
                })
              }
              placeholder="Nhập nguồn gốc con giống, độ mặn..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Hủy bỏ
            </button>

            <button type="submit" className="btn-save">
              Kích hoạt vụ nuôi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};