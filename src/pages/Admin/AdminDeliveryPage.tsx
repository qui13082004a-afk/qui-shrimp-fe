import { useEffect, useMemo, useState } from "react";
import { adminDeliveryService } from "../../services/adminDelivery.service";
import type {
  AdminDelivery,
  DeliveryStatus,
  DeliveryOrderOption,
  DeliveryStaffOption,
} from "../../services/adminDelivery.service";
import "./AdminDeliveryPage.css";

const statusLabels: Record<DeliveryStatus, string> = {
  cho_giao: "Chờ giao",
  dang_giao: "Đang giao",
  giao_thanh_cong: "Giao thành công",
  giao_that_bai: "Giao thất bại",
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

const formatMoney = (value?: number | string | null) => {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
};

export default function AdminDeliveryPage() {
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([]);
  const [readyOrders, setReadyOrders] = useState<DeliveryOrderOption[]>([]);
  const [deliveryStaffs, setDeliveryStaffs] = useState<DeliveryStaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "tat_ca">("tat_ca");
  const [selectedDelivery, setSelectedDelivery] = useState<AdminDelivery | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [assignForm, setAssignForm] = useState({
    id_don_hang: "",
    id_nhan_vien_giao: "",
    ghi_chu: "",
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const data = await adminDeliveryService.getAllDeliveries();
      setDeliveries(data || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải danh sách giao hàng");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignOptions = async () => {
    try {
      const [orders, staffs] = await Promise.all([
        adminDeliveryService.getReadyOrders(),
        adminDeliveryService.getDeliveryStaffs(),
      ]);

      setReadyOrders(orders || []);
      setDeliveryStaffs(staffs || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải đơn hàng hoặc nhân viên giao hàng");
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const customerName = item.DonHang?.NguoiDung?.ho_ten?.toLowerCase() || "";
      const customerPhone = item.DonHang?.NguoiDung?.so_dien_thoai?.toLowerCase() || "";
      const orderId = String(item.id_don_hang || "");
      const deliveryId = String(item.id_giao_hang || "");

      const matchSearch =
        !keyword ||
        customerName.includes(keyword) ||
        customerPhone.includes(keyword) ||
        orderId.includes(keyword) ||
        deliveryId.includes(keyword);

      const matchStatus = statusFilter === "tat_ca" || item.trang_thai === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [deliveries, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: deliveries.length,
      pending: deliveries.filter((item) => item.trang_thai === "cho_giao").length,
      shipping: deliveries.filter((item) => item.trang_thai === "dang_giao").length,
      success: deliveries.filter((item) => item.trang_thai === "giao_thanh_cong").length,
    };
  }, [deliveries]);

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    fetchAssignOptions();
  };

  const handleAssignDelivery = async () => {
    if (!assignForm.id_don_hang || !assignForm.id_nhan_vien_giao) {
      setAlert("Vui lòng chọn đơn hàng và nhân viên giao hàng");
      return;
    }

    try {
      await adminDeliveryService.assignDelivery(assignForm);

      setAlert("Phân công giao hàng thành công");
      setShowAssignModal(false);
      setAssignForm({
        id_don_hang: "",
        id_nhan_vien_giao: "",
        ghi_chu: "",
      });
      fetchDeliveries();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể phân công giao hàng");
    }
  };

  return (
    <div className="admin-page admin-delivery-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Bán hàng & giao hàng</p>
          <h1>Quản lý giao hàng</h1>
          <p>Theo dõi đơn giao, trạng thái vận chuyển và phân công nhân viên.</p>
        </div>

        <button type="button" className="admin-primary-btn" onClick={handleOpenAssignModal}>
          + Phân công giao hàng
        </button>
      </div>

      {alert && (
        <div className="admin-alert admin-delivery-alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>×</button>
        </div>
      )}

      <div className="admin-delivery-stats">
        <div className="admin-delivery-stat-card">
          <span>Tổng phiếu giao</span>
          <strong>{stats.total}</strong>
          <p>Tất cả phiếu giao trong hệ thống</p>
        </div>
        <div className="admin-delivery-stat-card">
          <span>Chờ giao</span>
          <strong>{stats.pending}</strong>
          <p>Đã phân công, chờ giao</p>
        </div>
        <div className="admin-delivery-stat-card">
          <span>Đang giao</span>
          <strong>{stats.shipping}</strong>
          <p>Nhân viên đang xử lý</p>
        </div>
        <div className="admin-delivery-stat-card">
          <span>Hoàn tất</span>
          <strong>{stats.success}</strong>
          <p>Đã giao thành công</p>
        </div>
      </div>

      <div className="admin-card admin-delivery-card">
        <div className="admin-delivery-card__top">
          <div>
            <h2>Danh sách giao hàng</h2>
            <p>Tra cứu theo khách hàng, số điện thoại hoặc mã đơn hàng.</p>
          </div>
        </div>

        <div className="admin-toolbar admin-delivery-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã đơn, mã giao hàng, tên khách, số điện thoại..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as DeliveryStatus | "tat_ca")}
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="cho_giao">Chờ giao</option>
            <option value="dang_giao">Đang giao</option>
            <option value="giao_thanh_cong">Giao thành công</option>
            <option value="giao_that_bai">Giao thất bại</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-delivery-table">
            <thead>
              <tr>
                <th>Mã giao</th>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>Nhân viên giao</th>
                <th>Trạng thái</th>
                <th>Thời gian giao</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-delivery-empty">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-delivery-empty">Không có phiếu giao phù hợp</div>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((item) => (
                  <tr key={item.id_giao_hang}>
                    <td><strong>#{item.id_giao_hang}</strong></td>
                    <td>
                      <strong>Đơn #{item.id_don_hang}</strong>
                      <span>{formatMoney(item.DonHang?.tong_thanh_toan)}</span>
                    </td>
                    <td>
                      <strong>{item.DonHang?.NguoiDung?.ho_ten || "—"}</strong>
                      <span>{item.DonHang?.NguoiDung?.so_dien_thoai || "Chưa có SĐT"}</span>
                    </td>
                    <td>
                      <strong>
                        {item.NhanVienGiaoHang?.NguoiDung?.ho_ten ||
                          `NV #${item.id_nhan_vien_giao || "—"}`}
                      </strong>
                      <span>{item.NhanVienGiaoHang?.khu_vuc_phu_trach || "Chưa cập nhật khu vực"}</span>
                    </td>
                    <td>
                      <span className={`admin-badge delivery-${item.trang_thai}`}>
                        {statusLabels[item.trang_thai]}
                      </span>
                    </td>
                    <td>{formatDate(item.thoi_gian_giao)}</td>
                    <td>
                      <div className="admin-delivery-actions">
                        <button type="button" onClick={() => setSelectedDelivery(item)}>
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-delivery-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Phân công giao hàng</h2>
                <p>Chọn đơn hàng cần giao và nhân viên giao hàng.</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-delivery-form">
              <label>
                Đơn hàng cần giao
                <select
                  value={assignForm.id_don_hang}
                  onChange={(event) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      id_don_hang: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn đơn hàng</option>
                  {readyOrders.map((order) => (
                    <option key={order.id_don_hang} value={order.id_don_hang}>
                      #{order.id_don_hang} - {order.NguoiDung?.ho_ten || "Khách hàng"} -{" "}
                      {formatMoney(order.tong_thanh_toan)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Nhân viên giao hàng
                <select
                  value={assignForm.id_nhan_vien_giao}
                  onChange={(event) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      id_nhan_vien_giao: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn nhân viên giao hàng</option>
                  {deliveryStaffs.map((staff) => (
                    <option key={staff.id_nguoi_dung} value={staff.id_nguoi_dung}>
                      {staff.ho_ten} - {staff.so_dien_thoai || staff.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-delivery-form__full">
                Ghi chú
                <textarea
                  value={assignForm.ghi_chu}
                  onChange={(event) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      ghi_chu: event.target.value,
                    }))
                  }
                  placeholder="Ghi chú khi phân công..."
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button type="button" className="admin-secondary-btn" onClick={() => setShowAssignModal(false)}>
                Hủy
              </button>
              <button type="button" className="admin-primary-btn" onClick={handleAssignDelivery}>
                Phân công
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDelivery && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-delivery-detail-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Chi tiết giao hàng #{selectedDelivery.id_giao_hang}</h2>
                <p>Thông tin đơn hàng, khách hàng và biên nhận giao hàng.</p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedDelivery(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-delivery-detail-grid">
              <div>
                <span>Mã đơn hàng</span>
                <strong>#{selectedDelivery.id_don_hang}</strong>
              </div>
              <div>
                <span>Tổng thanh toán</span>
                <strong>{formatMoney(selectedDelivery.DonHang?.tong_thanh_toan)}</strong>
              </div>
              <div>
                <span>Khách hàng</span>
                <strong>{selectedDelivery.DonHang?.NguoiDung?.ho_ten || "—"}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{selectedDelivery.DonHang?.NguoiDung?.so_dien_thoai || "—"}</strong>
              </div>
              <div>
                <span>Địa chỉ giao hàng</span>
                <strong>{selectedDelivery.DonHang?.dia_chi_giao_hang || "—"}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>{statusLabels[selectedDelivery.trang_thai]}</strong>
              </div>
              <div className="admin-delivery-detail-grid__full">
                <span>Ghi chú</span>
                <strong>{selectedDelivery.ghi_chu || "—"}</strong>
              </div>
            </div>

            <div className="admin-delivery-files">
              {selectedDelivery.anh_bien_nhan && (
                <a href={selectedDelivery.anh_bien_nhan} target="_blank" rel="noreferrer">
                  Xem ảnh biên nhận
                </a>
              )}

              {selectedDelivery.anh_hop_dong && (
                <a href={selectedDelivery.anh_hop_dong} target="_blank" rel="noreferrer">
                  Xem ảnh hợp đồng
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}