import React from "react";

interface DebtRegistrationModalProps {
  isOpen: boolean;
  pondName: string;
  cropName: string;
  note: string;
  onNoteChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const DebtRegistrationModal: React.FC<DebtRegistrationModalProps> = ({
  isOpen,
  pondName,
  cropName,
  note,
  onNoteChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>
          <i
            className="fa-solid fa-file-invoice-dollar"
            style={{ color: "#004077", marginRight: 8 }}
          />
          Khởi tạo hồ sơ khách hàng
        </h3>

        <p className="modal-subtitle">
          Hệ thống sẽ tự lấy thông tin ao nuôi và vụ nuôi hiện tại để tạo hồ sơ
          mua trả sau.
        </p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Ao nuôi</label>
            <input
              type="text"
              disabled
              value={pondName}
              style={{
                backgroundColor: "#e2e8f0",
                cursor: "not-allowed",
              }}
            />
          </div>

          <div className="form-group">
            <label>Vụ nuôi hiện tại</label>
            <input
              type="text"
              disabled
              value={cropName}
              style={{
                backgroundColor: "#e2e8f0",
                cursor: "not-allowed",
              }}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú đề xuất</label>
            <input
              type="text"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Ví dụ: Đăng ký hạn mức mua vật tư trả sau cho vụ nuôi hiện tại"
            />
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 14,
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.5,
            }}
          >
            Sau khi tạo hồ sơ thành công, bạn sẽ được chuyển sang bước xác thực
            CCCD và khuôn mặt.
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Hủy
            </button>

            <button type="submit" className="btn-save">
              Khởi tạo hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};