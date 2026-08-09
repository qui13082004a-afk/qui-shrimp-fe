import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  MapPin,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import {
  customerProfileService,
  type CustomerDebtProfile,
} from "../../../services/customerProfile.service";
import { toastError } from "../../../utils/notify";
import "./PostpaidProfilesPage.css";

const statusMap: Record<string, { label: string; className: string }> = {
  cho_kiem_tra: { label: "Chờ kiểm tra", className: "status-wait" },
  cho_de_xuat: { label: "Chờ đề xuất", className: "status-progress" },
  cho_admin_duyet: { label: "Chờ admin duyệt", className: "status-review" },
  da_duyet: { label: "Đã duyệt", className: "status-approved" },
  tu_choi: { label: "Từ chối", className: "status-rejected" },
};

const formatCurrency = (value?: number | string | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const formatDate = (value?: string | null) => {
  if (!value) return "--/--/----";
  return new Date(value).toLocaleDateString("vi-VN");
};

const getStatus = (profile?: CustomerDebtProfile | null) =>
  statusMap[String(profile?.trang_thai_ho_so || "")] || {
    label: "Chưa có trạng thái",
    className: "status-wait",
  };

const getPondAddress = (profile: CustomerDebtProfile) =>
  [
    profile.dia_chi_chi_tiet_ao,
    profile.phuong_xa_ao,
    profile.quan_huyen_ao,
    profile.tinh_thanh_ao,
  ]
    .filter(Boolean)
    .join(", ") || "Chưa có địa chỉ";

const PostpaidProfilesPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<CustomerDebtProfile[]>([]);
  const [selectedProfile, setSelectedProfile] =
    useState<CustomerDebtProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const summary = useMemo(() => {
    const approved = profiles.filter(
      (item) => item.trang_thai_ho_so === "da_duyet"
    ).length;
    const pending = profiles.filter((item) =>
      ["cho_kiem_tra", "cho_de_xuat", "cho_admin_duyet"].includes(
        String(item.trang_thai_ho_so)
      )
    ).length;
    const rejected = profiles.filter(
      (item) => item.trang_thai_ho_so === "tu_choi"
    ).length;

    return { approved, pending, rejected };
  }, [profiles]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setDetailError("");
      const res = await customerProfileService.getMyCustomerProfiles();
      const list = Array.isArray(res.data) ? res.data : [];

      setProfiles(list);
      setSelectedProfile((current) => {
        if (!current) return null;
        return list.find((item) => item.id_ho_so === current.id_ho_so) || null;
      });
    } catch (error) {
      console.error(error);
      toastError("Không thể tải danh sách hồ sơ mua trả sau.");
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const openDetail = async (profile: CustomerDebtProfile) => {
    if (!profile.id_ho_so) return;

    try {
      setDetailLoading(true);
      setDetailError("");
      const res = await customerProfileService.getCustomerProfileById(
        profile.id_ho_so
      );
      setSelectedProfile(res.data);
    } catch (error) {
      console.error(error);
      setSelectedProfile(null);
      setDetailError("Bạn không có quyền xem hồ sơ này hoặc hồ sơ không tồn tại.");
      toastError("Không thể mở chi tiết hồ sơ.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="postpaid-profiles-page">
      <section className="postpaid-hero">
        <div>
          <span className="postpaid-kicker">Hồ sơ mua trả sau</span>
          <h1>Theo dõi hồ sơ trả sau của bạn</h1>
          <p>
            Kiểm tra trạng thái xét duyệt, hạn mức được cấp, thời hạn thanh
            toán và lý do từ chối nếu hồ sơ chưa được duyệt.
          </p>
        </div>
        <button type="button" onClick={loadProfiles} disabled={loading}>
          <RefreshCw size={18} />
          Làm mới
        </button>
      </section>

      <section className="postpaid-summary-grid">
        <div className="postpaid-summary-card">
          <ClipboardList size={22} />
          <span>Tổng hồ sơ</span>
          <strong>{profiles.length}</strong>
        </div>
        <div className="postpaid-summary-card">
          <CalendarDays size={22} />
          <span>Đang xử lý</span>
          <strong>{summary.pending}</strong>
        </div>
        <div className="postpaid-summary-card">
          <ShieldCheck size={22} />
          <span>Đã duyệt</span>
          <strong>{summary.approved}</strong>
        </div>
        <div className="postpaid-summary-card">
          <AlertCircle size={22} />
          <span>Từ chối</span>
          <strong>{summary.rejected}</strong>
        </div>
      </section>

      {loading ? (
        <div className="postpaid-loading">Đang tải danh sách hồ sơ...</div>
      ) : profiles.length === 0 ? (
        <section className="postpaid-empty">
          <FileText size={42} />
          <h2>Bạn chưa có hồ sơ mua trả sau</h2>
          <p>
            Hãy chọn ao nuôi và vụ nuôi đang hoạt động để bắt đầu đăng ký hồ sơ
            mua trả sau.
          </p>
          <button type="button" onClick={() => navigate("/ponds")}>
            Tạo hồ sơ mới
            <ChevronRight size={18} />
          </button>
        </section>
      ) : (
        <div className="postpaid-content-grid">
          <section className="postpaid-list-card">
            <div className="postpaid-section-title">
              <h2>Danh sách hồ sơ</h2>
              <span>{profiles.length} hồ sơ</span>
            </div>

            <div className="postpaid-list">
              {profiles.map((profile) => {
                const status = getStatus(profile);
                const active = selectedProfile?.id_ho_so === profile.id_ho_so;

                return (
                  <button
                    type="button"
                    key={profile.id_ho_so}
                    className={`postpaid-row ${active ? "active" : ""}`}
                    onClick={() => openDetail(profile)}
                  >
                    <div className="postpaid-row__main">
                      <strong>Hồ sơ #{profile.id_ho_so}</strong>
                      <span>
                        {profile.AoNuoi?.ten_ao || "Ao nuôi"} /{" "}
                        {profile.VuNuoi?.ten_vu_nuoi || "Vụ nuôi"}
                      </span>
                    </div>
                    <div className="postpaid-row__meta">
                      <span className={`profile-status ${status.className}`}>
                        {status.label}
                      </span>
                      <span>{formatCurrency(profile.dinh_muc_cong_no)}</span>
                    </div>
                    <Eye size={18} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="postpaid-detail-card">
            {detailLoading ? (
              <div className="postpaid-detail-placeholder">
                Đang kiểm tra quyền xem hồ sơ...
              </div>
            ) : detailError ? (
              <div className="postpaid-detail-placeholder error">
                {detailError}
              </div>
            ) : selectedProfile ? (
              <>
                <div className="postpaid-detail-header">
                  <div>
                    <span>Chi tiết hồ sơ</span>
                    <h2>Hồ sơ #{selectedProfile.id_ho_so}</h2>
                  </div>
                  <span
                    className={`profile-status ${
                      getStatus(selectedProfile).className
                    }`}
                  >
                    {getStatus(selectedProfile).label}
                  </span>
                </div>

                <div className="postpaid-detail-grid">
                  <div className="detail-box">
                    <span>Ao nuôi</span>
                    <strong>{selectedProfile.AoNuoi?.ten_ao || "--"}</strong>
                  </div>
                  <div className="detail-box">
                    <span>Vụ nuôi</span>
                    <strong>
                      {selectedProfile.VuNuoi?.ten_vu_nuoi || "--"}
                    </strong>
                  </div>
                  <div className="detail-box">
                    <span>Hạn mức mong muốn</span>
                    <strong>
                      {formatCurrency(selectedProfile.han_muc_mong_muon)}
                    </strong>
                  </div>
                  <div className="detail-box highlight">
                    <span>Hạn mức được duyệt</span>
                    <strong>
                      {formatCurrency(selectedProfile.dinh_muc_cong_no)}
                    </strong>
                  </div>
                  <div className="detail-box">
                    <span>Thời hạn thanh toán</span>
                    <strong>
                      {formatDate(
                        selectedProfile.han_thanh_toan_hien_tai ||
                          selectedProfile.han_thanh_toan
                      )}
                    </strong>
                  </div>
                  <div className="detail-box">
                    <span>Ngày duyệt</span>
                    <strong>{formatDate(selectedProfile.ngay_duyet)}</strong>
                  </div>
                </div>

                <div className="postpaid-detail-info">
                  <div>
                    <MapPin size={18} />
                    <p>{getPondAddress(selectedProfile)}</p>
                  </div>
                  <div>
                    <WalletCards size={18} />
                    <p>
                      {selectedProfile.duoc_phep_tra_sau
                        ? "Hồ sơ đã được kích hoạt quyền mua trả sau."
                        : "Hồ sơ chưa được kích hoạt quyền mua trả sau."}
                    </p>
                  </div>
                </div>

                {(selectedProfile.ly_do_tu_choi ||
                  selectedProfile.ghi_chu ||
                  selectedProfile.ly_do_khoa) && (
                  <div className="postpaid-note">
                    <strong>Ghi chú xử lý</strong>
                    <p>
                      {selectedProfile.ly_do_tu_choi ||
                        selectedProfile.ly_do_khoa ||
                        selectedProfile.ghi_chu}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="postpaid-detail-placeholder">
                Chọn một hồ sơ trong danh sách để xem thông tin chi tiết.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default PostpaidProfilesPage;
