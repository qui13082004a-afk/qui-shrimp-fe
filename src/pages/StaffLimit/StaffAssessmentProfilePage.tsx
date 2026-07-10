import { useEffect, useMemo, useState } from "react";
import { staffAssessmentService } from "../../services/staffAssessment.service";
import "./StaffAssessmentProfilePage.css";

type StaffProfileStatus =
  | "cho_kiem_tra"
  | "cho_de_xuat"
  | "cho_admin_duyet"
  | "da_duyet"
  | "tu_choi";

type StaffVerifyStatus = "chua_xac_thuc" | "da_xac_thuc" | "that_bai";

type StaffCustomerProfile = {
  id_ho_so: number;
  id_nguoi_dung: number;
  id_ao: number;
  id_vu_nuoi: number;
  id_chinh_sach?: number | null;
  dinh_muc_cong_no?: number | string;
  han_muc_con_lai?: number | string;
  duoc_phep_tra_sau?: boolean;
  bi_khoa_tra_sau?: boolean;
  han_thanh_toan?: string | null;
  ngay_duyet?: string | null;
  ghi_chu?: string | null;
  trang_thai_ho_so: StaffProfileStatus;
  trang_thai_xac_thuc: StaffVerifyStatus;
  ly_do_tu_choi?: string | null;
  ly_do_khoa?: string | null;
  ly_do_xac_thuc_that_bai?: string | null;
  anh_cccd_mat_truoc?: string | null;
  anh_cccd_mat_sau?: string | null;
  anh_selfie?: string | null;
  do_tuong_dong?: number | string | null;
  ngay_xac_thuc?: string | null;
  NguoiDung?: {
    id_nguoi_dung: number;
    ho_ten: string;
    email: string;
    so_dien_thoai?: string | null;
    dia_chi?: string | null;
    tinh_thanh?: string | null;
  };
  AoNuoi?: {
    id_ao: number;
    ten_ao?: string;
    dien_tich?: number | string;
    dia_chi_ao?: string;
    ghi_chu?: string;
  };
  VuNuoi?: {
    id_vu_nuoi: number;
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
    so_luong_giong?: number;
    ngay_thu_hoach_du_kien?: string;
    trang_thai?: string;
    ghi_chu?: string;
  };
};

const profileStatusLabels: Record<StaffProfileStatus, string> = {
  cho_kiem_tra: "Chờ kiểm tra",
  cho_de_xuat: "Chờ đề xuất",
  cho_admin_duyet: "Chờ Admin duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
};

const verifyStatusLabels: Record<StaffVerifyStatus, string> = {
  chua_xac_thuc: "Chưa xác thực",
  da_xac_thuc: "Đã xác thực",
  that_bai: "Thất bại",
};

const formatMoney = (value?: number | string | null) => {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function StaffAssessmentProfilePage() {
  const [profiles, setProfiles] = useState<StaffCustomerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StaffProfileStatus | "tat_ca">("tat_ca");

  const [selectedProfile, setSelectedProfile] =
    useState<StaffCustomerProfile | null>(null);

  const [proposalProfile, setProposalProfile] =
    useState<StaffCustomerProfile | null>(null);

  const [surveyNote, setSurveyNote] = useState("");

  const [proposalForm, setProposalForm] = useState({
    han_muc_de_xuat: "",
    ly_do_de_xuat: "",
    nhan_xet_khao_sat: "",
    ph: "",
    oxy_hoa_tan: "",
    kich_co_tom: "",
    ngay_khao_sat: new Date().toISOString().slice(0, 10),
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await staffAssessmentService.getAssessmentProfiles();
      setProfiles(data || []);
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message ||
          "Không thể tải danh sách hồ sơ thẩm định"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const keyword = search.trim().toLowerCase();

      const customerName = profile.NguoiDung?.ho_ten?.toLowerCase() || "";
      const phone = profile.NguoiDung?.so_dien_thoai?.toLowerCase() || "";
      const email = profile.NguoiDung?.email?.toLowerCase() || "";
      const pondName = profile.AoNuoi?.ten_ao?.toLowerCase() || "";
      const seasonName = profile.VuNuoi?.ten_vu_nuoi?.toLowerCase() || "";
      const profileId = String(profile.id_ho_so || "");

      const matchSearch =
        !keyword ||
        customerName.includes(keyword) ||
        phone.includes(keyword) ||
        email.includes(keyword) ||
        pondName.includes(keyword) ||
        seasonName.includes(keyword) ||
        profileId.includes(keyword);

      const matchStatus =
        statusFilter === "tat_ca" ||
        profile.trang_thai_ho_so === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [profiles, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: profiles.length,
      waiting: profiles.filter(
        (item) => item.trang_thai_ho_so === "cho_kiem_tra"
      ).length,
      proposed: profiles.filter(
        (item) => item.trang_thai_ho_so === "cho_admin_duyet"
      ).length,
      approved: profiles.filter((item) => item.trang_thai_ho_so === "da_duyet")
        .length,
    };
  }, [profiles]);

  const openDetail = (profile: StaffCustomerProfile) => {
    setSelectedProfile(profile);
    setSurveyNote(profile.ghi_chu || "");
  };

  const handleSaveSurveyNote = async () => {
    if (!selectedProfile) return;

    try {
      const updated = await staffAssessmentService.updateAssessmentProfile(
        selectedProfile.id_ho_so,
        {
          ghi_chu: surveyNote,
          trang_thai_ho_so:
            selectedProfile.trang_thai_ho_so === "cho_kiem_tra"
              ? "cho_de_xuat"
              : selectedProfile.trang_thai_ho_so,
        }
      );

      setAlert("Lưu ghi chú khảo sát thành công");
      setSelectedProfile(updated as StaffCustomerProfile);
      fetchProfiles();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể lưu ghi chú");
    }
  };

  const openProposalModal = (profile: StaffCustomerProfile) => {
    setProposalProfile(profile);
    setProposalForm({
      han_muc_de_xuat: "",
      ly_do_de_xuat: "",
      nhan_xet_khao_sat: profile.ghi_chu || "",
      ph: "",
      oxy_hoa_tan: "",
      kich_co_tom: "",
      ngay_khao_sat: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCreateProposal = async () => {
    if (!proposalProfile) return;

    if (!proposalForm.han_muc_de_xuat || !proposalForm.ly_do_de_xuat.trim()) {
      setAlert("Vui lòng nhập hạn mức đề xuất và lý do đề xuất");
      return;
    }

    try {
      await staffAssessmentService.createLimitProposal({
        id_ho_so: proposalProfile.id_ho_so,
        han_muc_de_xuat: proposalForm.han_muc_de_xuat,
        ly_do_de_xuat: proposalForm.ly_do_de_xuat,
        nhan_xet_khao_sat: proposalForm.nhan_xet_khao_sat,
        ph: proposalForm.ph,
        oxy_hoa_tan: proposalForm.oxy_hoa_tan,
        kich_co_tom: proposalForm.kich_co_tom,
        ngay_khao_sat: proposalForm.ngay_khao_sat,
      });

      setAlert("Đã gửi phiếu đề xuất hạn mức cho Admin duyệt");
      setProposalProfile(null);
      fetchProfiles();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể lập phiếu đề xuất hạn mức"
      );
    }
  };

  return (
    <div className="staff-assessment-page">
      <div className="staff-assessment-header">
        <div>
          <p>Nhân viên định mức</p>
          <h1>Hồ sơ cần thẩm định</h1>
          <span>
            Kiểm tra hồ sơ mua trả sau, ghi nhận khảo sát và lập phiếu đề xuất
            hạn mức.
          </span>
        </div>
      </div>

      {alert && (
        <div className="staff-assessment-alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>
            ×
          </button>
        </div>
      )}

      <div className="staff-assessment-stats">
        <div className="staff-assessment-stat-card">
          <span>Tổng hồ sơ</span>
          <strong>{stats.total}</strong>
          <p>Tất cả hồ sơ được phân quyền xem</p>
        </div>
        <div className="staff-assessment-stat-card">
          <span>Chờ kiểm tra</span>
          <strong>{stats.waiting}</strong>
          <p>Cần khảo sát và ghi nhận thông tin</p>
        </div>
        <div className="staff-assessment-stat-card">
          <span>Chờ Admin duyệt</span>
          <strong>{stats.proposed}</strong>
          <p>Đã lập phiếu đề xuất</p>
        </div>
        <div className="staff-assessment-stat-card">
          <span>Đã duyệt</span>
          <strong>{stats.approved}</strong>
          <p>Hồ sơ đã được mở hạn mức</p>
        </div>
      </div>

      <div className="staff-assessment-card">
        <div className="staff-assessment-card__top">
          <div>
            <h2>Danh sách hồ sơ</h2>
            <p>Tìm kiếm theo khách hàng, ao nuôi, vụ nuôi hoặc mã hồ sơ.</p>
          </div>
        </div>

        <div className="staff-assessment-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm khách hàng, SĐT, email, ao nuôi, mã hồ sơ..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StaffProfileStatus | "tat_ca")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="cho_kiem_tra">Chờ kiểm tra</option>
            <option value="cho_de_xuat">Chờ đề xuất</option>
            <option value="cho_admin_duyet">Chờ Admin duyệt</option>
            <option value="da_duyet">Đã duyệt</option>
            <option value="tu_choi">Từ chối</option>
          </select>
        </div>

        <div className="staff-assessment-table-wrap">
          <table className="staff-assessment-table">
            <thead>
              <tr>
                <th>Hồ sơ</th>
                <th>Khách hàng</th>
                <th>Ao nuôi</th>
                <th>Vụ nuôi</th>
                <th>Hạn mức hiện tại</th>
                <th>Trạng thái</th>
                <th>Xác thực</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="staff-assessment-empty">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="staff-assessment-empty">
                      Không có hồ sơ phù hợp
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr key={profile.id_ho_so}>
                    <td>
                      <strong>HS #{profile.id_ho_so}</strong>
                      <span>Vụ #{profile.id_vu_nuoi}</span>
                    </td>

                    <td>
                      <strong>{profile.NguoiDung?.ho_ten || "—"}</strong>
                      <span>
                        {profile.NguoiDung?.so_dien_thoai ||
                          profile.NguoiDung?.email ||
                          "Chưa có liên hệ"}
                      </span>
                    </td>

                    <td>
                      <strong>{profile.AoNuoi?.ten_ao || "—"}</strong>
                      <span>
                        {profile.AoNuoi?.dien_tich
                          ? `${profile.AoNuoi.dien_tich} m²`
                          : "Chưa có diện tích"}
                      </span>
                    </td>

                    <td>
                      <strong>{profile.VuNuoi?.ten_vu_nuoi || "—"}</strong>
                      <span>
                        Thả giống: {formatDate(profile.VuNuoi?.ngay_tha_giong)}
                      </span>
                    </td>

                    <td>{formatMoney(profile.dinh_muc_cong_no)}</td>

                    <td>
                      <span
                        className={`staff-badge profile-${profile.trang_thai_ho_so}`}
                      >
                        {profileStatusLabels[profile.trang_thai_ho_so]}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`staff-badge verify-${profile.trang_thai_xac_thuc}`}
                      >
                        {verifyStatusLabels[profile.trang_thai_xac_thuc]}
                      </span>
                    </td>

                    <td>
                      <div className="staff-assessment-actions">
                        <button type="button" onClick={() => openDetail(profile)}>
                          Chi tiết
                        </button>
                        {["cho_kiem_tra", "cho_de_xuat"].includes(
                          profile.trang_thai_ho_so
                        ) && (
                          <button
                            type="button"
                            className="primary"
                            onClick={() => openProposalModal(profile)}
                          >
                            Lập phiếu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProfile && (
        <div className="staff-modal-overlay">
          <div className="staff-modal staff-modal--large">
            <div className="staff-modal__header">
              <div>
                <h2>Chi tiết hồ sơ #{selectedProfile.id_ho_so}</h2>
                <p>Thông tin khách hàng, ao nuôi, vụ nuôi và ghi chú khảo sát.</p>
              </div>
              <button type="button" onClick={() => setSelectedProfile(null)}>
                ×
              </button>
            </div>

            <div className="staff-profile-detail">
              <div className="staff-profile-section">
                <h3>Thông tin khách hàng</h3>
                <div className="staff-info-grid">
                  <div>
                    <span>Họ tên</span>
                    <strong>{selectedProfile.NguoiDung?.ho_ten || "—"}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>
                      {selectedProfile.NguoiDung?.so_dien_thoai || "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{selectedProfile.NguoiDung?.email || "—"}</strong>
                  </div>
                  <div>
                    <span>Tỉnh thành</span>
                    <strong>{selectedProfile.NguoiDung?.tinh_thanh || "—"}</strong>
                  </div>
                  <div className="staff-info-grid__full">
                    <span>Địa chỉ</span>
                    <strong>{selectedProfile.NguoiDung?.dia_chi || "—"}</strong>
                  </div>
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Ao nuôi & vụ nuôi</h3>
                <div className="staff-info-grid">
                  <div>
                    <span>Tên ao</span>
                    <strong>{selectedProfile.AoNuoi?.ten_ao || "—"}</strong>
                  </div>
                  <div>
                    <span>Diện tích</span>
                    <strong>
                      {selectedProfile.AoNuoi?.dien_tich
                        ? `${selectedProfile.AoNuoi.dien_tich} m²`
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Tên vụ nuôi</span>
                    <strong>{selectedProfile.VuNuoi?.ten_vu_nuoi || "—"}</strong>
                  </div>
                  <div>
                    <span>Ngày thả giống</span>
                    <strong>{formatDate(selectedProfile.VuNuoi?.ngay_tha_giong)}</strong>
                  </div>
                  <div>
                    <span>Số lượng giống</span>
                    <strong>{selectedProfile.VuNuoi?.so_luong_giong || "—"}</strong>
                  </div>
                  <div>
                    <span>Thu hoạch dự kiến</span>
                    <strong>
                      {formatDate(selectedProfile.VuNuoi?.ngay_thu_hoach_du_kien)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Hạn mức & xác thực</h3>
                <div className="staff-info-grid">
                  <div>
                    <span>Hạn mức hiện tại</span>
                    <strong>{formatMoney(selectedProfile.dinh_muc_cong_no)}</strong>
                  </div>
                  <div>
                    <span>Hạn thanh toán</span>
                    <strong>{formatDate(selectedProfile.han_thanh_toan)}</strong>
                  </div>
                  <div>
                    <span>Trạng thái hồ sơ</span>
                    <strong>
                      {profileStatusLabels[selectedProfile.trang_thai_ho_so]}
                    </strong>
                  </div>
                  <div>
                    <span>Trạng thái xác thực</span>
                    <strong>
                      {verifyStatusLabels[selectedProfile.trang_thai_xac_thuc]}
                    </strong>
                  </div>
                  <div>
                    <span>Độ tương đồng</span>
                    <strong>
                      {selectedProfile.do_tuong_dong
                        ? `${selectedProfile.do_tuong_dong}%`
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Ngày xác thực</span>
                    <strong>{formatDate(selectedProfile.ngay_xac_thuc)}</strong>
                  </div>
                </div>

                <div className="staff-docs">
                  {selectedProfile.anh_cccd_mat_truoc && (
                    <a
                      href={selectedProfile.anh_cccd_mat_truoc}
                      target="_blank"
                      rel="noreferrer"
                    >
                      CCCD mặt trước
                    </a>
                  )}
                  {selectedProfile.anh_cccd_mat_sau && (
                    <a
                      href={selectedProfile.anh_cccd_mat_sau}
                      target="_blank"
                      rel="noreferrer"
                    >
                      CCCD mặt sau
                    </a>
                  )}
                  {selectedProfile.anh_selfie && (
                    <a
                      href={selectedProfile.anh_selfie}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ảnh selfie
                    </a>
                  )}
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Ghi chú khảo sát</h3>
                <textarea
                  className="staff-survey-textarea"
                  value={surveyNote}
                  onChange={(event) => setSurveyNote(event.target.value)}
                  placeholder="Nhập ghi chú khảo sát thực tế ao nuôi, khả năng thanh toán, rủi ro..."
                />

                <div className="staff-modal__footer">
                  <button
                    type="button"
                    className="staff-secondary-btn"
                    onClick={() => setSelectedProfile(null)}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="staff-primary-btn"
                    onClick={handleSaveSurveyNote}
                  >
                    Lưu khảo sát
                  </button>
                  {["cho_kiem_tra", "cho_de_xuat"].includes(
                    selectedProfile.trang_thai_ho_so
                  ) && (
                    <button
                      type="button"
                      className="staff-primary-btn"
                      onClick={() => {
                        setSelectedProfile(null);
                        openProposalModal(selectedProfile);
                      }}
                    >
                      Lập phiếu đề xuất
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {proposalProfile && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <div className="staff-modal__header">
              <div>
                <h2>Lập phiếu đề xuất hạn mức</h2>
                <p>
                  Hồ sơ #{proposalProfile.id_ho_so} -{" "}
                  {proposalProfile.NguoiDung?.ho_ten || "Khách hàng"}
                </p>
              </div>
              <button type="button" onClick={() => setProposalProfile(null)}>
                ×
              </button>
            </div>

            <div className="staff-proposal-form">
              <label>
                Hạn mức đề xuất
                <input
                  value={proposalForm.han_muc_de_xuat}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      han_muc_de_xuat: event.target.value,
                    }))
                  }
                  placeholder="VD: 50000000"
                />
              </label>

              <label>
                Ngày khảo sát
                <input
                  type="date"
                  value={proposalForm.ngay_khao_sat}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      ngay_khao_sat: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Kích cỡ tôm
                <input
                  value={proposalForm.kich_co_tom}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      kich_co_tom: event.target.value,
                    }))
                  }
                  placeholder="VD: 60 con/kg"
                />
              </label>

              <label>
                pH
                <input
                  value={proposalForm.ph}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      ph: event.target.value,
                    }))
                  }
                  placeholder="VD: 7.5"
                />
              </label>

              <label>
                Oxy hòa tan
                <input
                  value={proposalForm.oxy_hoa_tan}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      oxy_hoa_tan: event.target.value,
                    }))
                  }
                  placeholder="VD: 5.2"
                />
              </label>

              <label className="staff-proposal-form__full">
                Lý do đề xuất
                <textarea
                  value={proposalForm.ly_do_de_xuat}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      ly_do_de_xuat: event.target.value,
                    }))
                  }
                  placeholder="Nhập lý do đề xuất hạn mức..."
                />
              </label>

              <label className="staff-proposal-form__full">
                Nhận xét khảo sát
                <textarea
                  value={proposalForm.nhan_xet_khao_sat}
                  onChange={(event) =>
                    setProposalForm((prev) => ({
                      ...prev,
                      nhan_xet_khao_sat: event.target.value,
                    }))
                  }
                  placeholder="Nhận xét thực tế ao nuôi, lịch sử mua, khả năng thanh toán..."
                />
              </label>
            </div>

            <div className="staff-modal__footer">
              <button
                type="button"
                className="staff-secondary-btn"
                onClick={() => setProposalProfile(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="staff-primary-btn"
                onClick={handleCreateProposal}
              >
                Gửi Admin duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}