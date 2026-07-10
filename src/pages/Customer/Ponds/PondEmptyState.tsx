import React from 'react';

interface PondEmptyStateProps {
  onAddClick: () => void;
}

export const PondEmptyState: React.FC<PondEmptyStateProps> = ({ onAddClick }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-image-wrapper">
        <img src="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400" alt="Mekong AquaHub" />
      </div>
      <h2>Chưa có ao nuôi nào được đăng ký</h2>
      <p>
        Bắt đầu quản lý vụ nuôi của bạn bằng cách thêm ao nuôi đầu tiên.{"\n"}
        Hệ thống sẽ giúp bạn theo dõi nhật ký, công nợ và sức khỏe tôm một cách thông minh.
      </p>
      <div className="empty-actions">
        <button onClick={onAddClick} className="btn-add-now">
          <i className="fa-solid fa-plus"></i> Thêm ao nuôi ngay
        </button>
        <span className="link-learn-more">
          <i className="fa-regular fa-circle-question"></i> Tìm hiểu thêm
        </span>
      </div>
      <div className="features-preview-grid">
        <div className="feature-preview-card"><i className="fa-solid fa-chart-line" style={{ color: '#3b82f6' }}></i><span>Theo dõi</span><p>Chỉ số nước 24/7</p></div>
        <div className="feature-preview-card"><i className="fa-regular fa-file-lines" style={{ color: '#10b981' }}></i><span>Sổ nợ</span><p>Quản lý thu chi</p></div>
        <div className="feature-preview-card"><i className="fa-solid fa-flask" style={{ color: '#f59e0b' }}></i><span>Phòng bệnh</span><p>Cảnh báo sức khỏe</p></div>
      </div>
    </div>
  );
};