import React from 'react';
import type { PondPayload } from '../../../services/pond.service';

interface PondModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: PondPayload;
  onChange: (data: PondPayload) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const PondModal: React.FC<PondModalProps> = ({
  isOpen, mode, formData, onChange, onSubmit, onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{mode === 'create' ? 'Đăng ký ao nuôi mới' : 'Cập nhật thông tin ao'}</h3>
        <p className="modal-subtitle">Vui lòng điền thông tin chính xác để hệ thống đồng bộ tính toán công nợ và vật tư sản xuất.</p>
        
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Tên định danh ao *</label>
            <input 
              type="text" required 
              value={formData.ten_ao || ''} 
              onChange={(e) => onChange({...formData, ten_ao: e.target.value})} 
              placeholder="Ví dụ: Ao số 04 - Khu A"
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label>Diện tích (m²) *</label>
              <input 
                type="number" required min="1" 
                value={formData.dien_tich || ''} 
                onChange={(e) => onChange({...formData, dien_tich: Number(e.target.value)})} 
                placeholder="Ví dụ: 1200"
              />
            </div>
            <div className="form-group">
              <label>Loại hình nuôi trồng</label>
              <input 
                type="text" 
                value={formData.loai_hinh_nuoi || ''} 
                onChange={(e) => onChange({...formData, loai_hinh_nuoi: e.target.value})} 
                placeholder="Ví dụ: Tôm thẻ chân trắng"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Địa chỉ ao</label>
            <input 
              type="text" 
              value={formData.dia_chi_ao || ''} 
              onChange={(e) => onChange({...formData, dia_chi_ao: e.target.value})} 
              placeholder="Địa chỉ khu vực ao nuôi..."
            />
          </div>
          {mode === 'edit' && (
            <div className="form-group">
              <label>Trạng thái hoạt động</label>
              <select 
                value={formData.trang_thai_ao || 'dang_hoat_dong'} 
                onChange={(e) => onChange({...formData, trang_thai_ao: e.target.value as any})}
              >
                <option value="dang_hoat_dong">Đang hoạt động sản xuất</option>
                <option value="tam_ngung">Tạm ngưng / Đang xử lý ao</option>
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Hủy bộ</button>
            <button type="submit" className="btn-save">
              <i className="fa-solid fa-check"></i> Xác nhận lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};