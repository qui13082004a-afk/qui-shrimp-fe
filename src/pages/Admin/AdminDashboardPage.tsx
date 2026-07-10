import "./AdminCommon.css";

export default function AdminDashboardPage() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Tổng quan</p>
          <h1>Trang quản trị</h1>
          <p>Quản lý hệ thống bán vật tư nuôi tôm, mua trả sau và công nợ.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-stat-card">
          <span>Hồ sơ mua trả sau</span>
          <strong>—</strong>
          <p>Đang chờ phiếu đề xuất hạn mức</p>
        </div>

        <div className="admin-stat-card">
          <span>Phiếu hạn mức</span>
          <strong>—</strong>
          <p>Chờ Admin duyệt</p>
        </div>

        <div className="admin-stat-card">
          <span>Gia hạn thanh toán</span>
          <strong>—</strong>
          <p>Yêu cầu đang xử lý</p>
        </div>

        <div className="admin-stat-card">
          <span>Thỏa thuận ba bên</span>
          <strong>—</strong>
          <p>Cần xác nhận hiệu lực</p>
        </div>
      </div>
    </div>
  );
}
