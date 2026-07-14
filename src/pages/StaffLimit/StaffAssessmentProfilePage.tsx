import { useEffect, useMemo, useState } from "react";
import {
  staffAssessmentService,
  type LimitPolicy,
} from "../../services/staffAssessment.service";
import "./StaffAssessmentProfilePage.css";

type StaffProfileStatus =
  | "cho_kiem_tra"
  | "cho_de_xuat"
  | "cho_admin_duyet"
  | "da_duyet"
  | "tu_choi";

type StaffVerifyStatus = "chua_xac_thuc" | "da_xac_thuc" | "that_bai";

type StaffCustomerProfile = {
  [key: string]: any;
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
    [key: string]: any;
    id_nguoi_dung: number;
    ho_ten: string;
    email: string;
    so_dien_thoai?: string | null;
    dia_chi?: string | null;
    tinh_thanh?: string | null;
  };
  AoNuoi?: {
    [key: string]: any;
    id_ao: number;
    ten_ao?: string;
    dien_tich?: number | string;
    dia_chi_ao?: string;
    ghi_chu?: string;
  };
  VuNuoi?: {
    [key: string]: any;
    id_vu_nuoi: number;
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
    so_luong_giong?: number;
    ngay_thu_hoach_du_kien?: string;
    trang_thai?: string;
    ghi_chu?: string;
  };
  ChinhSachHanMuc?: LimitPolicy | null;
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


const booleanLabel = (value?: boolean | number | null) => {
  if (value === true || value === 1) return "Có";
  if (value === false || value === 0) return "Không";
  return "—";
};

const pondStatusLabels: Record<string, string> = {
  dang_hoat_dong: "Đang hoạt động",
  tam_ngung: "Tạm ngưng",
};

const seasonStatusLabels: Record<string, string> = {
  dang_nuoi: "Đang nuôi",
  da_thu_hoach: "Đã thu hoạch",
  huy: "Đã hủy",
};

void seasonStatusLabels;

const mediaLabelMap: Record<string, string> = {
  anh_cccd_mat_truoc: "CCCD mặt trước",
  anh_cccd_mat_sau: "CCCD mặt sau",
  anh_selfie: "Ảnh selfie",
  anh_dai_dien: "Ảnh đại diện",
  anh_ao: "Ảnh ao nuôi",
  hinh_anh_ao: "Ảnh ao nuôi",
  anh_khao_sat: "Ảnh khảo sát",
  hinh_anh_khao_sat: "Ảnh khảo sát",
  anh_hop_dong: "Ảnh hợp đồng",
  anh_hop_dong_da_ky: "Ảnh hợp đồng đã ký",
  file_hop_dong_mau: "Hợp đồng mẫu",
  file_hop_dong_da_ky: "Hợp đồng đã ký",
  anh_bien_nhan: "Ảnh biên nhận",
  file_dinh_kem: "File đính kèm",
};

const toReadableLabel = (key: string) => {
  if (mediaLabelMap[key]) return mediaLabelMap[key];

  return key
    .replace(/^(anh|hinh_anh|file)_/, "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const collectProfileMedia = (profile: StaffCustomerProfile) => {
  const result: Array<{ key: string; label: string; url: string; isPdf: boolean }> = [];
  const seen = new Set<string>();

  const walk = (value: any, path = "") => {
    if (!value || typeof value !== "object") return;

    Object.entries(value).forEach(([key, item]) => {
      const currentPath = path ? `${path}.${key}` : key;

      if (item && typeof item === "object") {
        walk(item, currentPath);
        return;
      }

      if (typeof item !== "string" || !item.trim()) return;

      const normalizedKey = key.toLowerCase();
      const looksLikeMediaField =
        normalizedKey.startsWith("anh_") ||
        normalizedKey.startsWith("hinh_anh") ||
        normalizedKey.startsWith("file_") ||
        normalizedKey.includes("cccd") ||
        normalizedKey.includes("selfie") ||
        normalizedKey.includes("bien_nhan") ||
        normalizedKey.includes("hop_dong");

      if (!looksLikeMediaField || seen.has(item)) return;

      seen.add(item);
      result.push({
        key: currentPath,
        label: toReadableLabel(key),
        url: item,
        isPdf: /\.pdf(?:$|\?)/i.test(item),
      });
    });
  };

  walk(profile);
  return result;
};

const getDayDiff = (fromDate?: string | null, toDate?: string | null) => {
  if (!fromDate || !toDate) return null;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
};

const findPolicyByFarmingDays = (
  policies: LimitPolicy[],
  farmingDays: number | null
) => {
  if (farmingDays === null) return null;

  return (
    policies.find(
      (policy) =>
        policy.trang_thai === "hoat_dong" &&
        farmingDays >= Number(policy.tu_ngay) &&
        farmingDays <= Number(policy.den_ngay)
    ) || null
  );
};

const findReachedPolicy = (
  policies: LimitPolicy[],
  farmingDays: number | null
) => {
  if (farmingDays === null) return null;

  return (
    policies
      .filter(
        (policy) =>
          policy.trang_thai === "hoat_dong" &&
          farmingDays >= Number(policy.tu_ngay)
      )
      .sort((a, b) => Number(b.tu_ngay) - Number(a.tu_ngay))[0] || null
  );
};

const findNextPolicyInSameSet = (
  policies: LimitPolicy[],
  currentPolicy?: LimitPolicy | null,
  farmingDays?: number | null
) => {
  if (!currentPolicy) return findReachedPolicy(policies, farmingDays ?? null);

  return (
    policies
      .filter(
        (policy) =>
          policy.trang_thai === "hoat_dong" &&
          policy.ten_chinh_sach === currentPolicy.ten_chinh_sach &&
          Number(policy.tu_ngay) > Number(currentPolicy.tu_ngay) &&
          Number(policy.han_muc_toi_da) > Number(currentPolicy.han_muc_toi_da) &&
          (farmingDays === null ||
            farmingDays === undefined ||
            farmingDays >= Number(policy.tu_ngay))
      )
      .sort((a, b) => Number(a.tu_ngay) - Number(b.tu_ngay))[0] || null
  );
};

const getPolicyWindowText = (policy?: LimitPolicy | null) => {
  if (!policy) return "Chưa có chính sách phù hợp";
  return `${policy.ten_chinh_sach} (${policy.tu_ngay}-${policy.den_ngay} ngày)`;
};

const isEnabled = (value?: boolean | number | null) => {
  return value === true || value === 1;
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
    id_chinh_sach: "",
    han_muc_de_xuat: "",
    ly_do_de_xuat: "",
    nhan_xet_khao_sat: "",
    ph: "",
    oxy_hoa_tan: "",
    kich_co_tom: "",
    ngay_khao_sat: new Date().toISOString().slice(0, 10),
  });

  // Chính sách hạn mức đang áp dụng - dùng để kiểm tra hạn mức đề xuất có
  // vượt mức tối đa cho phép hay không, giống hệt logic đã có ở trang
  // "Tạo phiếu đề xuất hạn mức" (StaffCreateLimitProposalPage), để hai nơi
  // cùng tạo phiếu đề xuất không bị lệch quy tắc kiểm tra với nhau.
  const [policies, setPolicies] = useState<LimitPolicy[]>([]);
  const [confirmChecked, setConfirmChecked] = useState(true);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const [profileData, policyData] = await Promise.all([
        staffAssessmentService.getAssessmentProfiles(),
        staffAssessmentService.getActiveLimitPolicies(),
      ]);
      setProfiles(profileData || []);
      setPolicies(policyData || []);
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

  const policyReminderProfiles = useMemo(() => {
    return profiles
      .map((profile) => {
        const farmingDays = getDayDiff(
          profile.VuNuoi?.ngay_tha_giong,
          new Date().toISOString()
        );
        const targetPolicy = findNextPolicyInSameSet(
          policies,
          profile.ChinhSachHanMuc,
          farmingDays
        );
        const currentPolicyId = Number(profile.id_chinh_sach || 0);
        const targetPolicyId = Number(targetPolicy?.id_chinh_sach || 0);
        const shouldReview =
          Boolean(targetPolicy) &&
          targetPolicyId > 0 &&
          targetPolicyId !== currentPolicyId &&
          profile.trang_thai_ho_so === "da_duyet" &&
          isEnabled(profile.duoc_phep_tra_sau) &&
          !isEnabled(profile.bi_khoa_tra_sau);

        return {
          profile,
          farmingDays,
          targetPolicy,
          shouldReview,
        };
      })
      .filter((item) => item.shouldReview);
  }, [profiles, policies]);

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
    const farmingDays = getDayDiff(
      profile.VuNuoi?.ngay_tha_giong,
      new Date().toISOString()
    );
    const matchedPolicy =
      findNextPolicyInSameSet(policies, profile.ChinhSachHanMuc, farmingDays) ||
      findPolicyByFarmingDays(policies, farmingDays) ||
      policies.find(
        (policy) =>
          Number(policy.id_chinh_sach) === Number(profile.id_chinh_sach)
      ) ||
      null;

    setProposalProfile(profile);
    setConfirmChecked(true);
    setProposalForm({
      id_chinh_sach: matchedPolicy?.id_chinh_sach
        ? String(matchedPolicy.id_chinh_sach)
        : "",
      han_muc_de_xuat: matchedPolicy?.han_muc_toi_da
        ? String(matchedPolicy.han_muc_toi_da)
        : "",
      ly_do_de_xuat: "",
      nhan_xet_khao_sat: profile.ghi_chu || "",
      ph: "",
      oxy_hoa_tan: "",
      kich_co_tom: "",
      ngay_khao_sat: new Date().toISOString().slice(0, 10),
    });
  };

  // Số ngày nuôi tính tới ngày khảo sát - dùng để tìm chính sách hạn mức phù hợp,
  // giống hệt cách tính ở trang "Tạo phiếu đề xuất hạn mức".
  const proposalFarmingDays = useMemo(() => {
    return getDayDiff(
      proposalProfile?.VuNuoi?.ngay_tha_giong,
      proposalForm.ngay_khao_sat
    );
  }, [proposalProfile, proposalForm.ngay_khao_sat]);

  const proposalMatchedPolicy = useMemo(() => {
    if (proposalForm.id_chinh_sach) {
      return (
        policies.find(
          (policy) =>
            Number(policy.id_chinh_sach) ===
            Number(proposalForm.id_chinh_sach)
        ) || null
      );
    }

    if (proposalFarmingDays === null) return null;

    return findPolicyByFarmingDays(policies, proposalFarmingDays);
  }, [policies, proposalFarmingDays, proposalForm.id_chinh_sach]);

  const proposalPolicyOptions = useMemo(() => {
    const currentPolicy = proposalProfile?.ChinhSachHanMuc;

    if (!currentPolicy) {
      return policies.filter((policy) => policy.trang_thai === "hoat_dong");
    }

    return policies
      .filter(
        (policy) =>
          policy.trang_thai === "hoat_dong" &&
          policy.ten_chinh_sach === currentPolicy.ten_chinh_sach &&
          Number(policy.tu_ngay) > Number(currentPolicy.tu_ngay) &&
          Number(policy.han_muc_toi_da) > Number(currentPolicy.han_muc_toi_da)
      )
      .sort((a, b) => Number(a.tu_ngay) - Number(b.tu_ngay));
  }, [policies, proposalProfile]);

  const handleProposalPolicyChange = (policyId: string) => {
    const selectedPolicy =
      policies.find(
        (policy) => Number(policy.id_chinh_sach) === Number(policyId)
      ) || null;

    setProposalForm((prev) => ({
      ...prev,
      id_chinh_sach: policyId,
      han_muc_de_xuat: selectedPolicy?.han_muc_toi_da
        ? String(selectedPolicy.han_muc_toi_da)
        : prev.han_muc_de_xuat,
    }));
  };

  const isProposalOverPolicyLimit = useMemo(() => {
    if (!proposalMatchedPolicy || !proposalForm.han_muc_de_xuat) return false;
    return (
      Number(proposalForm.han_muc_de_xuat) >
      Number(proposalMatchedPolicy.han_muc_toi_da || 0)
    );
  }, [proposalMatchedPolicy, proposalForm.han_muc_de_xuat]);

  const handleCreateProposal = async () => {
    if (!proposalProfile) return;

    if (!proposalForm.han_muc_de_xuat || !proposalForm.ly_do_de_xuat.trim()) {
      setAlert("Vui lòng nhập hạn mức đề xuất và lý do đề xuất");
      return;
    }

    // Chặn đề xuất vượt hạn mức tối đa của chính sách đang áp dụng - đây là
    // quy tắc bắt buộc, không được để lọt qua lối tắt này (trước đây modal ở
    // đây thiếu bước kiểm tra, khác với trang tạo phiếu đề xuất đầy đủ).
    if (isProposalOverPolicyLimit) {
      setAlert("Hạn mức đề xuất đang vượt quá hạn mức tối đa của chính sách");
      return;
    }

    if (!confirmChecked) {
      setAlert("Vui lòng xác nhận đã khảo sát thực tế trước khi gửi");
      return;
    }

    try {
      await staffAssessmentService.createLimitProposal({
        id_ho_so: proposalProfile.id_ho_so,
        id_chinh_sach: proposalForm.id_chinh_sach || null,
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

      <div className="staff-policy-reminder">
        <div className="staff-policy-reminder__head">
          <div>
            <p>Theo dõi ngày nuôi</p>
            <h2>
              {policyReminderProfiles.length > 0
                ? `${policyReminderProfiles.length} hồ sơ đã tới mốc chính sách mới`
                : "Chưa có hồ sơ nào tới mốc chính sách mới"}
            </h2>
          </div>
          <span>
            Hệ thống đối chiếu ngày thả giống với chính sách hạn mức. Job backend
            sẽ gửi thông báo cho nhân viên định mức mỗi ngày lúc 07:00.
          </span>
        </div>

        {policyReminderProfiles.length > 0 ? (
          <div className="staff-policy-reminder__list">
            {policyReminderProfiles.slice(0, 4).map((item) => (
              <button
                type="button"
                key={item.profile.id_ho_so}
                onClick={() => openProposalModal(item.profile)}
              >
                <strong>
                  HS #{item.profile.id_ho_so} -{" "}
                  {item.profile.NguoiDung?.ho_ten || "Khách hàng"}
                </strong>
                <span>
                  {item.farmingDays} ngày nuôi ·{" "}
                  {getPolicyWindowText(item.targetPolicy)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="staff-policy-reminder__empty">
            Đã tải {profiles.length} hồ sơ và {policies.length} chính sách hoạt động.
            Mở chi tiết hồ sơ để xem số ngày nuôi và chính sách phù hợp.
          </div>
        )}
      </div>

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
                      <span>
                        Ngày nuôi:{" "}
                        {getDayDiff(
                          profile.VuNuoi?.ngay_tha_giong,
                          new Date().toISOString()
                        ) ?? "—"}
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
                <p>Thông tin đầy đủ của khách hàng, ao nuôi, vụ nuôi và hồ sơ mua trả sau.</p>
              </div>
              <button type="button" onClick={() => setSelectedProfile(null)}>×</button>
            </div>

            <div className="staff-profile-detail">
              <div className="staff-profile-section">
                <h3>Thông tin khách hàng</h3>
                <div className="staff-info-grid">
                  <div><span>Mã khách hàng</span><strong>#{selectedProfile.NguoiDung?.id_nguoi_dung || selectedProfile.id_nguoi_dung}</strong></div>
                  <div><span>Họ tên</span><strong>{selectedProfile.NguoiDung?.ho_ten || "—"}</strong></div>
                  <div><span>Số điện thoại</span><strong>{selectedProfile.NguoiDung?.so_dien_thoai || "—"}</strong></div>
                  <div><span>Email</span><strong>{selectedProfile.NguoiDung?.email || "—"}</strong></div>
                  <div><span>Ngày sinh</span><strong>{formatDate(selectedProfile.NguoiDung?.ngay_sinh)}</strong></div>
                  <div><span>Giới tính</span><strong>{selectedProfile.NguoiDung?.gioi_tinh || "—"}</strong></div>
                  <div><span>Số CCCD</span><strong>{selectedProfile.NguoiDung?.so_cccd || selectedProfile.so_cccd || "—"}</strong></div>
                  <div><span>Tỉnh thành</span><strong>{selectedProfile.NguoiDung?.tinh_thanh || "—"}</strong></div>
                  <div className="staff-info-grid__full"><span>Địa chỉ</span><strong>{selectedProfile.NguoiDung?.dia_chi || "—"}</strong></div>
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Thông tin ao nuôi</h3>
                <div className="staff-info-grid">
                  <div><span>Mã ao</span><strong>#{selectedProfile.AoNuoi?.id_ao || selectedProfile.id_ao}</strong></div>
                  <div><span>Tên ao</span><strong>{selectedProfile.AoNuoi?.ten_ao || "—"}</strong></div>
                  <div><span>Diện tích</span><strong>{selectedProfile.AoNuoi?.dien_tich ? `${selectedProfile.AoNuoi.dien_tich} m²` : "—"}</strong></div>
                  <div><span>Loại hình nuôi</span><strong>{selectedProfile.AoNuoi?.loai_hinh_nuoi || "—"}</strong></div>
                  <div><span>Trạng thái ao</span><strong>{pondStatusLabels[selectedProfile.AoNuoi?.trang_thai_ao] || selectedProfile.AoNuoi?.trang_thai_ao || "—"}</strong></div>
                  <div><span>Ngày tạo ao</span><strong>{formatDate(selectedProfile.AoNuoi?.ngay_tao)}</strong></div>
                  <div className="staff-info-grid__full"><span>Địa chỉ ao</span><strong>{selectedProfile.AoNuoi?.dia_chi_ao || "—"}</strong></div>
                  <div className="staff-info-grid__full"><span>Ghi chú ao</span><strong>{selectedProfile.AoNuoi?.ghi_chu || "—"}</strong></div>
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Thông tin vụ nuôi</h3>
                <div className="staff-info-grid">
                  <div><span>Mã vụ nuôi</span><strong>#{selectedProfile.VuNuoi?.id_vu_nuoi || selectedProfile.id_vu_nuoi}</strong></div>
                  <div><span>Tên vụ nuôi</span><strong>{selectedProfile.VuNuoi?.ten_vu_nuoi || "—"}</strong></div>
                  <div><span>Ngày thả giống</span><strong>{formatDate(selectedProfile.VuNuoi?.ngay_tha_giong)}</strong></div>
                  <div><span>Số ngày nuôi hiện tại</span><strong>{getDayDiff(selectedProfile.VuNuoi?.ngay_tha_giong, new Date().toISOString()) ?? "—"}</strong></div>
                  <div><span>Chính sách phù hợp</span><strong>{getPolicyWindowText(findPolicyByFarmingDays(policies, getDayDiff(selectedProfile.VuNuoi?.ngay_tha_giong, new Date().toISOString())))}</strong></div>
                  <div><span>Số lượng giống</span><strong>{selectedProfile.VuNuoi?.so_luong_giong?.toLocaleString?.("vi-VN") || selectedProfile.VuNuoi?.so_luong_giong || "—"}</strong></div>
                  <div><span>Thu hoạch dự kiến</span><strong>{formatDate(selectedProfile.VuNuoi?.ngay_thu_hoach_du_kien)}</strong></div>

                  <div className="staff-info-grid__full"><span>Ghi chú vụ nuôi</span><strong>{selectedProfile.VuNuoi?.ghi_chu || "—"}</strong></div>
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Hồ sơ mua trả sau</h3>
                <div className="staff-info-grid">
                  <div><span>Mã hồ sơ</span><strong>#{selectedProfile.id_ho_so}</strong></div>
                  <div><span>Mã chính sách</span><strong>{selectedProfile.id_chinh_sach ? `#${selectedProfile.id_chinh_sach}` : "—"}</strong></div>
                  <div><span>Hạn mức hiện tại</span><strong>{formatMoney(selectedProfile.dinh_muc_cong_no)}</strong></div>
                  <div><span>Hạn mức còn lại</span><strong>{formatMoney(selectedProfile.han_muc_con_lai)}</strong></div>
                  <div><span>Được phép trả sau</span><strong>{booleanLabel(selectedProfile.duoc_phep_tra_sau)}</strong></div>
                  <div><span>Bị khóa trả sau</span><strong>{booleanLabel(selectedProfile.bi_khoa_tra_sau)}</strong></div>
                  <div><span>Hạn thanh toán</span><strong>{formatDate(selectedProfile.han_thanh_toan)}</strong></div>
                  <div><span>Ngày duyệt</span><strong>{formatDate(selectedProfile.ngay_duyet)}</strong></div>
                  <div><span>Trạng thái hồ sơ</span><strong>{profileStatusLabels[selectedProfile.trang_thai_ho_so]}</strong></div>
                  <div><span>Trạng thái xác thực</span><strong>{verifyStatusLabels[selectedProfile.trang_thai_xac_thuc]}</strong></div>
                  <div><span>Độ tương đồng</span><strong>{selectedProfile.do_tuong_dong !== null && selectedProfile.do_tuong_dong !== undefined ? `${selectedProfile.do_tuong_dong}%` : "—"}</strong></div>
                  <div><span>Ngày xác thực</span><strong>{formatDate(selectedProfile.ngay_xac_thuc)}</strong></div>
                  {selectedProfile.ly_do_tu_choi && <div className="staff-info-grid__full danger"><span>Lý do từ chối</span><strong>{selectedProfile.ly_do_tu_choi}</strong></div>}
                  {selectedProfile.ly_do_khoa && <div className="staff-info-grid__full danger"><span>Lý do khóa trả sau</span><strong>{selectedProfile.ly_do_khoa}</strong></div>}
                  {selectedProfile.ly_do_xac_thuc_that_bai && <div className="staff-info-grid__full danger"><span>Lý do xác thực thất bại</span><strong>{selectedProfile.ly_do_xac_thuc_that_bai}</strong></div>}
                </div>
              </div>

              <div className="staff-profile-section">
                <h3>Hình ảnh và tài liệu hồ sơ</h3>
                {collectProfileMedia(selectedProfile).length > 0 ? (
                  <div className="staff-media-grid">
                    {collectProfileMedia(selectedProfile).map((media) => (
                      <article className="staff-media-card" key={`${media.key}-${media.url}`}>
                        <div className="staff-media-card__title">{media.label}</div>
                        {media.isPdf ? (
                          <div className="staff-media-card__file"><span>PDF</span><strong>Tài liệu hồ sơ</strong></div>
                        ) : (
                          <a href={media.url} target="_blank" rel="noreferrer" className="staff-media-card__preview">
                            <img src={media.url} alt={media.label} loading="lazy" />
                          </a>
                        )}
                        <a href={media.url} target="_blank" rel="noreferrer" className="staff-media-card__action">
                          {media.isPdf ? "Xem tài liệu" : "Xem ảnh lớn"}
                        </a>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="staff-media-empty">Hồ sơ chưa có hình ảnh hoặc tài liệu đính kèm.</div>
                )}
              </div>

              <div className="staff-profile-section">
                <h3>Ghi chú khảo sát</h3>
                <textarea className="staff-survey-textarea" value={surveyNote} onChange={(event) => setSurveyNote(event.target.value)} placeholder="Nhập ghi chú khảo sát thực tế ao nuôi, khả năng thanh toán, rủi ro..." />

                <div className="staff-modal__footer">
                  <button type="button" className="staff-secondary-btn" onClick={() => setSelectedProfile(null)}>Đóng</button>
                  <button type="button" className="staff-primary-btn" onClick={handleSaveSurveyNote}>Lưu khảo sát</button>
                  {["cho_kiem_tra", "cho_de_xuat"].includes(selectedProfile.trang_thai_ho_so) && (
                    <button type="button" className="staff-primary-btn" onClick={() => { setSelectedProfile(null); openProposalModal(selectedProfile); }}>Lập phiếu đề xuất</button>
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

              <label className="staff-proposal-form__full">
                Chính sách hạn mức áp dụng
                <select
                  value={proposalForm.id_chinh_sach}
                  onChange={(event) =>
                    handleProposalPolicyChange(event.target.value)
                  }
                >
                  <option value="">
                    {proposalProfile?.ChinhSachHanMuc
                      ? "Chọn giai đoạn nâng tiếp theo"
                      : "Tự động theo số ngày nuôi"}
                  </option>
                  {proposalPolicyOptions.map((policy) => (
                    <option
                      key={policy.id_chinh_sach}
                      value={policy.id_chinh_sach}
                    >
                      {policy.ten_chinh_sach} · {policy.tu_ngay}-{policy.den_ngay} ngày · tối đa{" "}
                      {formatMoney(policy.han_muc_toi_da)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="staff-proposal-policy-hint">
                Chính sách phù hợp:{" "}
                <strong>
                  {proposalMatchedPolicy?.ten_chinh_sach || "Chưa xác định"}
                </strong>
                {" · "}Hạn mức tối đa:{" "}
                <strong>
                  {proposalMatchedPolicy
                    ? formatMoney(proposalMatchedPolicy.han_muc_toi_da)
                    : "—"}
                </strong>
                {" · "}Số ngày nuôi:{" "}
                <strong>
                  {proposalFarmingDays !== null
                    ? `${proposalFarmingDays} ngày`
                    : "—"}
                </strong>
              </div>

              {isProposalOverPolicyLimit && (
                <div className="staff-proposal-warning-inline">
                  Hạn mức đề xuất đang vượt quá hạn mức tối đa của chính sách
                  đang áp dụng.
                </div>
              )}

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

              <label className="staff-proposal-confirm">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(event) => setConfirmChecked(event.target.checked)}
                />
                <span>
                  Tôi xác nhận đã khảo sát thực tế và thông tin đề xuất là
                  đúng theo kết quả thẩm định.
                </span>
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
                disabled={isProposalOverPolicyLimit || !confirmChecked}
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
