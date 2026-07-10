import React from 'react';

interface CropSeasonModalProps {
  isOpen: boolean;
  pondName: string;
  formData: {
    ten_vu_nuoi: string;
    ngay_tha_giong: string;
    so_luong_giong: number;
    ngay_thu_hoach_du_kien: string;
    ghi_chu: string;
  };
  onChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CropSeasonModal: React.FC<CropSeasonModalProps> = ({
  isOpen, pondName, formData, onChange, onSubmit, onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3><i className="fa-solid fa-seedling" style={{color: '#16a34a'}}></i> Khởi tạo vụ nuôi mới</h3>
        <p className="modal-subtitle">Thực hiện thả con giống vụ mới cho ao **{pondName}** để kích hoạt theo dõi nhật ký.</p>
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Tên vụ nuôi trồng *</label>
            <input 
              type="text" required 
              value={formData.ten_vu_nuoi} 
              onChange={(e) => onChange({...formData, ten_vu_nuoi: e.target.value})} 
              placeholder="Ví dụ: Vụ Thu Đông 2026" 
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Ngày thả giống thực tế</label>
              <input 
                type="date" 
                value={formData.ngay_tha_giong} 
                onChange={(e) => onChange({...formData, ngay_tha_giong: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Số lượng con giống (con)</label>
              <input 
                type="number" min="0" 
                value={formData.so_luong_giong || ''} 
                onChange={(e) => onChange({...formData, so_luong_giong: Number(e.target.value)})} 
                placeholder="Ví dụ: 150000" 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Ngày hoạch tính dự kiến</label>
            <input 
              type="date" 
              value={formData.ngay_thu_hoach_du_kien} 
              onChange={(e) => onChange({...formData, ngay_thu_hoach_du_kien: e.target.value})} 
            />
          </div>
          <div className="form-group">
            <label>Ghi chú vụ giống</label>
            <input 
              type="text" 
              value={formData.ghi_chu} 
              onChange={(e) => onChange({...formData, ghi_chu: e.target.value})} 
              placeholder="Nhập nguồn gốc con giống, độ mặn..." 
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy bỏ</button>
            <button type="submit" className="btn-save">Kích hoạt vụ nuôi</button>
          </div>
        </form>
      </div>
    </div>
  );
};