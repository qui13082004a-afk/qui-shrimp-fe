import React from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  pondName: string;
  cropName: string;
  note: string;
  onNoteChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen, pondName, cropName, note, onNoteChange, onSubmit, onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Đăng ký hồ sơ trả sau</h3>
        <p className="modal-subtitle">Gửi hồ sơ thẩm định tài chính cho vụ **{cropName}** thuộc ao **{pondName}**.</p>
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Vụ nuôi áp dụng</label>
            <input type="text" disabled value={cropName} style={{ backgroundColor: '#e2e8f0', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label>Nội dung đề xuất vốn trả sau</label>
            <input 
              type="text" required
              value={note} 
              onChange={(e) => onNoteChange(e.target.value)} 
              placeholder="Nhu cầu hạn mức công nợ vật tư..." 
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy</button>
            <button type="submit" className="btn-save">Nộp hồ sơ xét duyệt</button>
          </div>
        </form>
      </div>
    </div>
  );
};