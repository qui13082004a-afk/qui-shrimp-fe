import { useEffect, useMemo, useState } from "react";
import { adminDeliveryService } from "../../services/adminDelivery.service";
import type { DeliveryStaffOption } from "../../services/adminDelivery.service";
import {
  locationService,
  type Province,
  type Ward,
} from "../../services/location.service";
import "./AdminDeliveryPage.css";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function AdminDeliveryStaffPage() {
  const [staffs, setStaffs] = useState<DeliveryStaffOption[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"tat_ca" | "dang_lam" | "nghi">(
    "tat_ca"
  );
  const [selectedStaff, setSelectedStaff] = useState<DeliveryStaffOption | null>(null);
  const [assignAreaForm, setAssignAreaForm] = useState({
    id_tinh_thanh: "",
    id_phuong_xa: "",
    mo_ta_khu_vuc: "",
  });

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const data = await adminDeliveryService.getAllDeliveryStaffs();
      setStaffs(data || []);
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message ||
          "Không thể tải danh sách nhân viên giao hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await locationService.getProvinces();
      setProvinces(res.data || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải tỉnh/thành");
    }
  };

  const fetchWards = async (provinceId: string) => {
    if (!provinceId) {
      setWards([]);
      return;
    }

    try {
      const res = await locationService.getWardsByProvince(provinceId);
      setWards(res.data || []);
    } catch (error: any) {
      setWards([]);
      setAlert(error?.response?.data?.message || "Không thể tải phường/xã");
    }
  };

  useEffect(() => {
    fetchStaffs();
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedStaff && assignAreaForm.id_tinh_thanh) {
      void fetchWards(assignAreaForm.id_tinh_thanh);
      return;
    }

    if (!assignAreaForm.id_tinh_thanh) {
      setWards([]);
    }
  }, [selectedStaff, assignAreaForm.id_tinh_thanh]);

  const filteredStaffs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return staffs.filter((staff) => {
      const name = staff.NguoiDung?.ho_ten?.toLowerCase() || "";
      const email = staff.NguoiDung?.email?.toLowerCase() || "";
      const phone = staff.NguoiDung?.so_dien_thoai?.toLowerCase() || "";
      const area = staff.khu_vuc_phu_trach?.toLowerCase() || "";

      const matchSearch =
        !keyword ||
        name.includes(keyword) ||
        email.includes(keyword) ||
        phone.includes(keyword) ||
        area.includes(keyword) ||
        String(staff.id_nhan_vien_giao_hang).includes(keyword);

      const matchStatus =
        statusFilter === "tat_ca" || staff.trang_thai === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, staffs, statusFilter]);

  const stats = useMemo(
    () => ({
      total: staffs.length,
      active: staffs.filter((item) => item.trang_thai === "dang_lam").length,
      inactive: staffs.filter((item) => item.trang_thai === "nghi").length,
      noArea: staffs.filter((item) => !item.khu_vuc_phu_trach).length,
    }),
    [staffs]
  );

  const openAssignAreaModal = (staff: DeliveryStaffOption) => {
    setSelectedStaff(staff);
    setAssignAreaForm({
      id_tinh_thanh: "",
      id_phuong_xa: "",
      mo_ta_khu_vuc: "",
    });
    setWards([]);
  };

  const handleSaveArea = async () => {
    if (!selectedStaff) return;

    if (!assignAreaForm.id_tinh_thanh || !assignAreaForm.id_phuong_xa) {
      setAlert("Vui lòng chọn tỉnh/thành và phường/xã phụ trách");
      return;
    }

    try {
      setSaving(true);
      await adminDeliveryService.updateDeliveryStaffArea(
        selectedStaff.id_nhan_vien_giao_hang,
        assignAreaForm
      );
      setAlert("Cập nhật khu vực phụ trách thành công");
      setSelectedStaff(null);
      setAssignAreaForm({
        id_tinh_thanh: "",
        id_phuong_xa: "",
        mo_ta_khu_vuc: "",
      });
      setWards([]);
      fetchStaffs();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể cập nhật khu vực phụ trách"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page admin-delivery-page">
      <div className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Quản lý người dùng</p>
          <h1>Nhân viên giao hàng</h1>
          <p>Theo dõi toàn bộ shipper và phân công khu vực phụ trách.</p>
        </div>
      </div>

      {alert && (
        <div className="admin-alert admin-delivery-alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>
            ×
          </button>
        </div>
      )}

      <div className="admin-delivery-stats">
        <div className="admin-delivery-stat-card">
          <span>Tổng nhân viên</span>
          <strong>{stats.total}</strong>
          <p>Tất cả tài khoản nhân viên giao hàng</p>
        </div>
        <div className="admin-delivery-stat-card">
          <span>Đang làm</span>
          <strong>{stats.active}</strong>
          <p>Sẵn sàng nhận đơn giao</p>
        </div>
        <div className="admin-delivery-stat-card">
          <span>Nghỉ</span>
          <strong>{stats.inactive}</strong>
          <p>Tạm nghỉ hoặc không hoạt động</p>
        </div>
        <div className="admin-delivery-stat-card">
          <span>Chưa có khu vực</span>
          <strong>{stats.noArea}</strong>
          <p>Cần được phân công khu vực phụ trách</p>
        </div>
      </div>

      <div className="admin-card admin-delivery-card">
        <div className="admin-delivery-card__top">
          <div>
            <h2>Danh sách nhân viên giao hàng</h2>
            <p>Tìm kiếm theo tên, email, số điện thoại hoặc khu vực phụ trách.</p>
          </div>
        </div>

        <div className="admin-toolbar admin-delivery-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên, email, SĐT, khu vực hoặc mã nhân viên..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "tat_ca" | "dang_lam" | "nghi")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="dang_lam">Đang làm</option>
            <option value="nghi">Nghỉ</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-delivery-table">
            <thead>
              <tr>
                <th>Mã NV giao</th>
                <th>Nhân viên</th>
                <th>Liên hệ</th>
                <th>Khu vực phụ trách</th>
                <th>Trạng thái</th>
                <th>Ngày bắt đầu</th>
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
              ) : filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-delivery-empty">
                      Không có nhân viên giao hàng phù hợp
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((staff) => (
                  <tr key={staff.id_nhan_vien_giao_hang}>
                    <td>
                      <strong>NV #{staff.id_nhan_vien_giao_hang}</strong>
                    </td>
                    <td>
                      <strong>{staff.NguoiDung?.ho_ten || "—"}</strong>
                      <span>{staff.NguoiDung?.email || "Chưa có email"}</span>
                    </td>
                    <td>
                      <strong>{staff.NguoiDung?.so_dien_thoai || "Chưa có SĐT"}</strong>
                      <span>ID người dùng: #{staff.NguoiDung?.id_nguoi_dung || "—"}</span>
                    </td>
                    <td>
                      <strong>{staff.khu_vuc_phu_trach || "Chưa cập nhật khu vực"}</strong>
                      <span>{staff.ghi_chu || "Chưa có ghi chú"}</span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          staff.trang_thai === "dang_lam"
                            ? "delivery-giao_thanh_cong"
                            : "delivery-giao_that_bai"
                        }`}
                      >
                        {staff.trang_thai === "dang_lam" ? "Đang làm" : "Nghỉ"}
                      </span>
                    </td>
                    <td>{formatDate(staff.ngay_bat_dau)}</td>
                    <td>
                      <div className="admin-delivery-actions">
                        <button type="button" onClick={() => openAssignAreaModal(staff)}>
                          Phân công khu vực
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

      {selectedStaff && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-delivery-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Phân công khu vực phụ trách</h2>
                <p>
                  {selectedStaff.NguoiDung?.ho_ten || "Nhân viên giao hàng"} - NV #
                  {selectedStaff.id_nhan_vien_giao_hang}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setSelectedStaff(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-delivery-form">
              <label>
                Tỉnh/thành phụ trách
                <select
                  value={assignAreaForm.id_tinh_thanh}
                  onChange={(event) =>
                    setAssignAreaForm((prev) => ({
                      ...prev,
                      id_tinh_thanh: event.target.value,
                      id_phuong_xa: "",
                    }))
                  }
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((province) => (
                    <option
                      key={province.id_tinh_thanh}
                      value={province.id_tinh_thanh}
                    >
                      {province.ma_tinh} - {province.ten_tinh}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Phường/xã phụ trách
                <select
                  value={assignAreaForm.id_phuong_xa}
                  onChange={(event) =>
                    setAssignAreaForm((prev) => ({
                      ...prev,
                      id_phuong_xa: event.target.value,
                    }))
                  }
                  disabled={!assignAreaForm.id_tinh_thanh}
                >
                  <option value="">
                    {assignAreaForm.id_tinh_thanh
                      ? "Chọn phường/xã"
                      : "Chọn tỉnh/thành trước"}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.id_phuong_xa} value={ward.id_phuong_xa}>
                      {ward.ten_xa}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-delivery-form__full">
                Mô tả khu vực
                <input
                  value={assignAreaForm.mo_ta_khu_vuc}
                  onChange={(event) =>
                    setAssignAreaForm((prev) => ({
                      ...prev,
                      mo_ta_khu_vuc: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Tuyến 1, khu vực gần chợ, ấp..."
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setSelectedStaff(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleSaveArea}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu khu vực"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
