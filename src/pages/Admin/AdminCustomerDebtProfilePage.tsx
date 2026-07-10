import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  customerProfileService,
  type CustomerDebtProfile,
  type UpdateCustomerProfilePayload,
} from "../../services/customerProfile.service";
import "./AdminCommon.css";
import "./AdminCustomerDebtProfilePage.css";

const profileStatusLabel: Record<string, string> = {
  cho_kiem_tra: "Chờ kiểm tra",
  cho_de_xuat: "Chờ đề xuất",
  cho_admin_duyet: "Chờ Admin duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
};

const verifyStatusLabel: Record<string, string> = {
  chua_xac_thuc: "Chưa xác thực",
  da_xac_thuc: "Đã xác thực",
  that_bai: "Thất bại",
};

const formatCurrency = (value?: number | string | null) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function AdminCustomerDebtProfilePage() {
  const [profiles, setProfiles] = useState<CustomerDebtProfile[]>([]);
  const [selectedProfile, setSelectedProfile] =
    useState<CustomerDebtProfile | null>(null);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lockFilter, setLockFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  const [updateForm, setUpdateForm] = useState<UpdateCustomerProfilePayload>({
    trang_thai_ho_so: "cho_kiem_tra",
    ly_do_tu_choi: "",
    ghi_chu: "",
  });

  const [lockForm, setLockForm] = useState<UpdateCustomerProfilePayload>({
    bi_khoa_tra_sau: false,
    ly_do_khoa: "",
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await customerProfileService.getAllCustomerProfiles();
      setProfiles(Array.isArray(res) ? res : res?.data || []);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Không tải được danh sách hồ sơ mua trả sau"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      pending: profiles.filter(
        (item) =>
          item.trang_thai_ho_so === "cho_kiem_tra" ||
          item.trang_thai_ho_so === "cho_de_xuat" ||
          item.trang_thai_ho_so === "cho_admin_duyet"
      ).length,
      approved: profiles.filter((item) => item.trang_thai_ho_so === "da_duyet")
        .length,
      locked: profiles.filter((item) => item.bi_khoa_tra_sau).length,
    };
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((item) => {
      const searchText = `${item.id_ho_so || ""} ${
        item.NguoiDung?.ho_ten || ""
      } ${item.NguoiDung?.so_dien_thoai || ""} ${item.AoNuoi?.ten_ao || ""} ${
        item.VuNuoi?.ten_vu_nuoi || ""
      } ${item.ghi_chu || ""}`.toLowerCase();

      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());

      const matchStatus =
        statusFilter === "all" || item.trang_thai_ho_so === statusFilter;

      const matchLock =
        lockFilter === "all" ||
        (lockFilter === "locked" && item.bi_khoa_tra_sau) ||
        (lockFilter === "unlocked" && !item.bi_khoa_tra_sau);

      return matchKeyword && matchStatus && matchLock;
    });
  }, [profiles, keyword, statusFilter, lockFilter]);

  const openDetail = (profile: CustomerDebtProfile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setSelectedProfile(null);
    setShowDetailModal(false);
    setShowUpdateModal(false);
    setShowLockModal(false);
  };

  const openUpdateModal = (profile: CustomerDebtProfile) => {
    setSelectedProfile(profile);
    setUpdateForm({
      trang_thai_ho_so: profile.trang_thai_ho_so || "cho_kiem_tra",
      ly_do_tu_choi: profile.ly_do_tu_choi || "",
      ghi_chu: profile.ghi_chu || "",
    });
    setShowUpdateModal(true);
  };

  const openLockModal = (profile: CustomerDebtProfile) => {
    setSelectedProfile(profile);
    setLockForm({
      bi_khoa_tra_sau: !profile.bi_khoa_tra_sau,
      ly_do_khoa: profile.bi_khoa_tra_sau ? "" : profile.ly_do_khoa || "",
    });
    setShowLockModal(true);
  };

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedProfile?.id_ho_so) {
      setMessage("Không tìm thấy mã hồ sơ");
      return;
    }

    if (
      updateForm.trang_thai_ho_so === "tu_choi" &&
      !updateForm.ly_do_tu_choi?.trim()
    ) {
      setMessage("Vui lòng nhập lý do từ chối hồ sơ");
      return;
    }

    try {
      setSaving(true);

      await customerProfileService.updateCustomerProfile(
        selectedProfile.id_ho_so,
        {
          trang_thai_ho_so: updateForm.trang_thai_ho_so,
          ly_do_tu_choi:
            updateForm.trang_thai_ho_so === "tu_choi"
              ? updateForm.ly_do_tu_choi?.trim()
              : null,
          ghi_chu: updateForm.ghi_chu?.trim() || null,
        }
      );

      setMessage("Cập nhật hồ sơ mua trả sau thành công");
      setShowUpdateModal(false);
      setShowDetailModal(false);
      fetchProfiles();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleLockProfile = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedProfile?.id_ho_so) {
      setMessage("Không tìm thấy mã hồ sơ");
      return;
    }

    if (lockForm.bi_khoa_tra_sau && !lockForm.ly_do_khoa?.trim()) {
      setMessage("Vui lòng nhập lý do khóa trả sau");
      return;
    }

    try {
      setSaving(true);

      await customerProfileService.updateCustomerProfile(
        selectedProfile.id_ho_so,
        {
          bi_khoa_tra_sau: lockForm.bi_khoa_tra_sau,
          ly_do_khoa: lockForm.bi_khoa_tra_sau
            ? lockForm.ly_do_khoa?.trim()
            : null,
        }
      );

      setMessage(
        lockForm.bi_khoa_tra_sau
          ? "Khóa trả sau thành công"
          : "Mở khóa trả sau thành công"
      );

      setShowLockModal(false);
      setShowDetailModal(false);
      fetchProfiles();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Cập nhật khóa trả sau thất bại");
    } finally {
      setSaving(false);
    }
  };

  const getCustomerName = (profile: CustomerDebtProfile) => {
    return profile.NguoiDung?.ho_ten || "Chưa có thông tin";
  };

  const getPhone = (profile: CustomerDebtProfile) => {
    return profile.NguoiDung?.so_dien_thoai || "Chưa có SĐT";
  };

  return (
    <div className="admin-page customer-profile-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Hồ sơ</p>
          <h1>Quản lý hồ sơ mua trả sau</h1>
          <p>Theo dõi hồ sơ khách hàng, hạn mức và hạn thanh toán theo vụ nuôi.</p>
        </div>
      </div>

      {message && (
        <div className="admin-alert customer-profile-alert">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <div className="customer-profile-stats">
        <div className="customer-profile-stat-card">
          <span>Tổng hồ sơ</span>
          <strong>{stats.total}</strong>
          <p>Toàn bộ hồ sơ trả sau</p>
        </div>

        <div className="customer-profile-stat-card">
          <span>Đang xử lý</span>
          <strong>{stats.pending}</strong>
          <p>Chờ kiểm tra hoặc đề xuất</p>
        </div>

        <div className="customer-profile-stat-card">
          <span>Đã duyệt</span>
          <strong>{stats.approved}</strong>
          <p>Được phép mua trả sau</p>
        </div>

        <div className="customer-profile-stat-card">
          <span>Đang khóa</span>
          <strong>{stats.locked}</strong>
          <p>Bị khóa quyền trả sau</p>
        </div>
      </div>

      <div className="admin-card customer-profile-card">
        <div className="customer-profile-card__top">
          <div>
            <h2>Danh sách hồ sơ</h2>
            <p>Tra cứu hồ sơ theo khách hàng, ao nuôi, vụ nuôi và trạng thái xử lý.</p>
          </div>
        </div>

        <div className="admin-toolbar customer-profile-toolbar">
          <input
            value={keyword}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            placeholder="Tìm mã hồ sơ, khách hàng, SĐT, ao, vụ nuôi..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="cho_kiem_tra">Chờ kiểm tra</option>
            <option value="cho_de_xuat">Chờ đề xuất</option>
            <option value="cho_admin_duyet">Chờ Admin duyệt</option>
            <option value="da_duyet">Đã duyệt</option>
            <option value="tu_choi">Từ chối</option>
          </select>

          <select
            value={lockFilter}
            onChange={(event) => setLockFilter(event.target.value)}
          >
            <option value="all">Tất cả khóa trả sau</option>
            <option value="unlocked">Không bị khóa</option>
            <option value="locked">Đang bị khóa</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table customer-profile-table">
            <thead>
              <tr>
                <th>Hồ sơ</th>
                <th>Khách hàng</th>
                <th>Ao / Vụ nuôi</th>
                <th>Hạn mức</th>
                <th>Hạn thanh toán</th>
                <th>Xác thực</th>
                <th>Trạng thái</th>
                <th>Khóa</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="customer-profile-empty">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="customer-profile-empty">
                      <strong>Chưa có hồ sơ phù hợp</strong>
                      <span>Hãy thay đổi từ khóa tìm kiếm hoặc bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((item) => (
                  <tr key={item.id_ho_so}>
                    <td>
                      <strong>#{item.id_ho_so}</strong>
                      <span>Vụ #{item.id_vu_nuoi}</span>
                    </td>

                    <td>
                      <strong>{getCustomerName(item)}</strong>
                      <span>{getPhone(item)}</span>
                    </td>

                    <td>
                      <strong>{item.AoNuoi?.ten_ao || "Chưa có ao"}</strong>
                      <span>{item.VuNuoi?.ten_vu_nuoi || "Chưa có vụ nuôi"}</span>
                    </td>

                    <td>
                      <strong>{formatCurrency(item.dinh_muc_cong_no)}</strong>
                      <span>{item.duoc_phep_tra_sau ? "Được trả sau" : "Chưa mở trả sau"}</span>
                    </td>

                    <td>
                      <strong>{formatDate(item.han_thanh_toan_hien_tai || item.han_thanh_toan)}</strong>
                      {item.gia_han_moi_nhat && <span>Có gia hạn mới nhất</span>}
                    </td>

                    <td>
                      <span className={`admin-badge ${item.trang_thai_xac_thuc}`}>
                        {verifyStatusLabel[item.trang_thai_xac_thuc || ""] ||
                          "Chưa rõ"}
                      </span>
                    </td>

                    <td>
                      <span className={`admin-badge ${item.trang_thai_ho_so}`}>
                        {profileStatusLabel[item.trang_thai_ho_so || ""] ||
                          "Chưa rõ"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-badge ${
                          item.bi_khoa_tra_sau ? "locked" : "unlocked"
                        }`}
                      >
                        {item.bi_khoa_tra_sau ? "Đang khóa" : "Bình thường"}
                      </span>
                    </td>

                    <td>
                      <div className="customer-profile-actions">
                        <button onClick={() => openDetail(item)}>Chi tiết</button>
                        <button onClick={() => openUpdateModal(item)}>Cập nhật</button>
                        <button
                          className={item.bi_khoa_tra_sau ? "" : "danger"}
                          onClick={() => openLockModal(item)}
                        >
                          {item.bi_khoa_tra_sau ? "Mở khóa" : "Khóa"}
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

      {showDetailModal && selectedProfile && (
        <div className="admin-modal-overlay">
          <div className="admin-modal customer-profile-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Chi tiết hồ sơ mua trả sau</h2>
                <p>Thông tin khách hàng, ao nuôi, hạn mức, xác thực và trạng thái công nợ.</p>
              </div>

              <button className="admin-modal__close" onClick={closeDetail}>
                ×
              </button>
            </div>

            <div className="customer-profile-detail">
              <div className="customer-profile-section">
                <h3>Thông tin khách hàng</h3>

                <div className="customer-profile-info-grid">
                  <div>
                    <span>Khách hàng</span>
                    <strong>{getCustomerName(selectedProfile)}</strong>
                  </div>

                  <div>
                    <span>Số điện thoại</span>
                    <strong>{getPhone(selectedProfile)}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedProfile.NguoiDung?.email || "Chưa có"}</strong>
                  </div>

                  <div>
                    <span>Địa chỉ</span>
                    <strong>{selectedProfile.NguoiDung?.dia_chi || "Chưa có"}</strong>
                  </div>
                </div>
              </div>

              <div className="customer-profile-section">
                <h3>Ao nuôi / Vụ nuôi</h3>

                <div className="customer-profile-info-grid">
                  <div>
                    <span>Ao nuôi</span>
                    <strong>{selectedProfile.AoNuoi?.ten_ao || "Chưa có"}</strong>
                  </div>

                  <div>
                    <span>Diện tích</span>
                    <strong>
                      {selectedProfile.AoNuoi?.dien_tich
                        ? `${selectedProfile.AoNuoi.dien_tich} m²`
                        : "Chưa có"}
                    </strong>
                  </div>

                  <div>
                    <span>Vụ nuôi</span>
                    <strong>{selectedProfile.VuNuoi?.ten_vu_nuoi || "Chưa có"}</strong>
                  </div>

                  <div>
                    <span>Ngày thả giống</span>
                    <strong>{formatDate(selectedProfile.VuNuoi?.ngay_tha_giong)}</strong>
                  </div>
                </div>
              </div>

              <div className="customer-profile-section">
                <h3>Hạn mức / Thanh toán</h3>

                <div className="customer-profile-money-box">
                  <span>Định mức công nợ</span>
                  <strong>{formatCurrency(selectedProfile.dinh_muc_cong_no)}</strong>
                </div>

                <div className="customer-profile-info-grid">
                  <div>
                    <span>Được phép trả sau</span>
                    <strong>{selectedProfile.duoc_phep_tra_sau ? "Có" : "Không"}</strong>
                  </div>

                  <div>
                    <span>Hạn thanh toán hiện tại</span>
                    <strong>
                      {formatDate(
                        selectedProfile.han_thanh_toan_hien_tai ||
                          selectedProfile.han_thanh_toan
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Ngày duyệt</span>
                    <strong>{formatDate(selectedProfile.ngay_duyet)}</strong>
                  </div>

                  <div>
                    <span>Trạng thái khóa</span>
                    <strong>
                      {selectedProfile.bi_khoa_tra_sau ? "Đang khóa trả sau" : "Bình thường"}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="customer-profile-section">
                <h3>Xác thực giấy tờ</h3>

                <div className="customer-profile-info-grid">
                  <div>
                    <span>Trạng thái xác thực</span>
                    <strong>
                      {verifyStatusLabel[selectedProfile.trang_thai_xac_thuc || ""] ||
                        "Chưa rõ"}
                    </strong>
                  </div>

                  <div>
                    <span>Độ tương đồng</span>
                    <strong>
                      {selectedProfile.do_tuong_dong
                        ? `${selectedProfile.do_tuong_dong}%`
                        : "Chưa có"}
                    </strong>
                  </div>

                  <div>
                    <span>Ngày xác thực</span>
                    <strong>{formatDate(selectedProfile.ngay_xac_thuc)}</strong>
                  </div>

                  <div>
                    <span>Lý do thất bại</span>
                    <strong>
                      {selectedProfile.ly_do_xac_thuc_that_bai || "Không có"}
                    </strong>
                  </div>
                </div>

                <div className="customer-profile-docs">
                  {selectedProfile.anh_cccd_mat_truoc && (
                    <a href={selectedProfile.anh_cccd_mat_truoc} target="_blank" rel="noreferrer">
                      CCCD mặt trước
                    </a>
                  )}

                  {selectedProfile.anh_cccd_mat_sau && (
                    <a href={selectedProfile.anh_cccd_mat_sau} target="_blank" rel="noreferrer">
                      CCCD mặt sau
                    </a>
                  )}

                  {selectedProfile.anh_selfie && (
                    <a href={selectedProfile.anh_selfie} target="_blank" rel="noreferrer">
                      Ảnh selfie
                    </a>
                  )}
                </div>
              </div>

              {(selectedProfile.ly_do_tu_choi ||
                selectedProfile.ly_do_khoa ||
                selectedProfile.ghi_chu) && (
                <div className="customer-profile-section">
                  <h3>Ghi chú / Lý do</h3>

                  {selectedProfile.ly_do_tu_choi && (
                    <div className="customer-profile-note danger">
                      <span>Lý do từ chối</span>
                      <p>{selectedProfile.ly_do_tu_choi}</p>
                    </div>
                  )}

                  {selectedProfile.ly_do_khoa && (
                    <div className="customer-profile-note danger">
                      <span>Lý do khóa</span>
                      <p>{selectedProfile.ly_do_khoa}</p>
                    </div>
                  )}

                  {selectedProfile.ghi_chu && (
                    <div className="customer-profile-note">
                      <span>Ghi chú</span>
                      <p>{selectedProfile.ghi_chu}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="customer-profile-detail-actions">
                <button
                  className="admin-secondary-btn"
                  onClick={() => openUpdateModal(selectedProfile)}
                >
                  Cập nhật hồ sơ
                </button>

                <button
                  className={selectedProfile.bi_khoa_tra_sau ? "admin-secondary-btn" : "admin-primary-btn danger"}
                  onClick={() => openLockModal(selectedProfile)}
                >
                  {selectedProfile.bi_khoa_tra_sau ? "Mở khóa trả sau" : "Khóa trả sau"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedProfile && (
        <div className="admin-modal-overlay">
          <div className="customer-profile-confirm">
            <h2>Cập nhật hồ sơ</h2>
            <p>Admin chỉ cập nhật trạng thái, lý do từ chối và ghi chú. Hạn mức được mở qua phiếu đề xuất hạn mức.</p>

            <form onSubmit={handleUpdateProfile}>
              <label>
                Trạng thái hồ sơ
                <select
                  value={updateForm.trang_thai_ho_so}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      trang_thai_ho_so: event.target
                        .value as UpdateCustomerProfilePayload["trang_thai_ho_so"],
                    }))
                  }
                >
                  <option value="cho_kiem_tra">Chờ kiểm tra</option>
                  <option value="cho_de_xuat">Chờ đề xuất</option>
                  <option value="cho_admin_duyet">Chờ Admin duyệt</option>
                  <option value="da_duyet">Đã duyệt</option>
                  <option value="tu_choi">Từ chối</option>
                </select>
              </label>

              {updateForm.trang_thai_ho_so === "tu_choi" && (
                <label>
                  Lý do từ chối
                  <textarea
                    value={updateForm.ly_do_tu_choi || ""}
                    onChange={(event) =>
                      setUpdateForm((prev) => ({
                        ...prev,
                        ly_do_tu_choi: event.target.value,
                      }))
                    }
                    placeholder="Nhập lý do từ chối hồ sơ..."
                  />
                </label>
              )}

              <label>
                Ghi chú
                <textarea
                  value={updateForm.ghi_chu || ""}
                  onChange={(event) =>
                    setUpdateForm((prev) => ({
                      ...prev,
                      ghi_chu: event.target.value,
                    }))
                  }
                  placeholder="Nhập ghi chú nội bộ..."
                />
              </label>

              <div className="customer-profile-confirm__actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLockModal && selectedProfile && (
        <div className="admin-modal-overlay">
          <div className="customer-profile-confirm">
            <div className="customer-profile-confirm__icon">
              {selectedProfile.bi_khoa_tra_sau ? "✓" : "!"}
            </div>

            <h2>
              {selectedProfile.bi_khoa_tra_sau
                ? "Mở khóa trả sau?"
                : "Khóa quyền trả sau?"}
            </h2>

            <p>
              {selectedProfile.bi_khoa_tra_sau
                ? "Khách hàng sẽ có thể tiếp tục sử dụng quyền mua trả sau nếu hồ sơ còn hiệu lực."
                : "Khách hàng sẽ tạm thời không thể đặt đơn mua trả sau bằng hồ sơ này."}
            </p>

            <form onSubmit={handleLockProfile}>
              {!selectedProfile.bi_khoa_tra_sau && (
                <label>
                  Lý do khóa
                  <textarea
                    value={lockForm.ly_do_khoa || ""}
                    onChange={(event) =>
                      setLockForm((prev) => ({
                        ...prev,
                        ly_do_khoa: event.target.value,
                      }))
                    }
                    placeholder="Nhập lý do khóa quyền trả sau..."
                  />
                </label>
              )}

              <div className="customer-profile-confirm__actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setShowLockModal(false)}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className={
                    selectedProfile.bi_khoa_tra_sau
                      ? "admin-primary-btn"
                      : "admin-primary-btn danger"
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Đang xử lý..."
                    : selectedProfile.bi_khoa_tra_sau
                    ? "Xác nhận mở khóa"
                    : "Xác nhận khóa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}