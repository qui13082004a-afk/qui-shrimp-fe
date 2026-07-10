import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  staffAssessmentService,
  type LimitPolicy,
} from "../../services/staffAssessment.service";
import "./StaffCreateLimitProposalPage.css";

type ProfileStatus =
  | "cho_kiem_tra"
  | "cho_de_xuat"
  | "cho_admin_duyet"
  | "da_duyet"
  | "tu_choi";

type StaffProfile = {
  id_ho_so: number;
  id_nguoi_dung: number;
  id_ao: number;
  id_vu_nuoi: number;
  id_chinh_sach?: number | null;
  dinh_muc_cong_no?: number | string;
  trang_thai_ho_so: ProfileStatus;
  ghi_chu?: string | null;
  NguoiDung?: {
    ho_ten?: string;
    email?: string;
    so_dien_thoai?: string | null;
  };
  AoNuoi?: {
    ten_ao?: string;
    dien_tich?: number | string;
  };
  VuNuoi?: {
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
  };
};

type PreviewFile = {
  file: File;
  url: string;
};

const formatMoney = (value?: number | string | null) => {
  return Number(value || 0).toLocaleString("vi-VN") + " đ";
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
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

export default function StaffCreateLimitProposalPage() {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [policies, setPolicies] = useState<LimitPolicy[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [alert, setAlert] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(true);
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);

  const [form, setForm] = useState({
    han_muc_de_xuat: "",
    ngay_khao_sat: new Date().toISOString().slice(0, 10),
    kich_co_tom: "",
    ph: "",
    oxy_hoa_tan: "",
    ly_do_de_xuat: "",
    nhan_xet_khao_sat: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [profileData, policyData] = await Promise.all([
        staffAssessmentService.getAssessmentProfiles(),
        staffAssessmentService.getActiveLimitPolicies(),
      ]);

      const availableProfiles = (profileData || []).filter((profile: any) =>
        ["cho_kiem_tra", "cho_de_xuat"].includes(profile.trang_thai_ho_so)
      );

      setProfiles(availableProfiles);
      setPolicies(policyData || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      previewFiles.forEach((item) => URL.revokeObjectURL(item.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProfile = useMemo(() => {
    return profiles.find(
      (profile) => String(profile.id_ho_so) === selectedProfileId
    );
  }, [profiles, selectedProfileId]);

  const farmingDays = useMemo(() => {
    return getDayDiff(
      selectedProfile?.VuNuoi?.ngay_tha_giong,
      form.ngay_khao_sat
    );
  }, [selectedProfile, form.ngay_khao_sat]);

  const matchedPolicy = useMemo(() => {
    if (farmingDays === null) return null;

    return (
      policies.find(
        (policy) =>
          policy.trang_thai === "hoat_dong" &&
          farmingDays >= Number(policy.tu_ngay) &&
          farmingDays <= Number(policy.den_ngay)
      ) || null
    );
  }, [policies, farmingDays]);

  const isOverPolicyLimit = useMemo(() => {
    if (!matchedPolicy || !form.han_muc_de_xuat) return false;
    return (
      Number(form.han_muc_de_xuat) > Number(matchedPolicy.han_muc_toi_da || 0)
    );
  }, [matchedPolicy, form.han_muc_de_xuat]);

  useEffect(() => {
    if (selectedProfile) {
      setForm((prev) => ({
        ...prev,
        nhan_xet_khao_sat: selectedProfile.ghi_chu || prev.nhan_xet_khao_sat,
      }));
    }
  }, [selectedProfile]);

  const resetForm = () => {
    previewFiles.forEach((item) => URL.revokeObjectURL(item.url));

    setSelectedProfileId("");
    setPreviewFiles([]);
    setConfirmChecked(true);
    setForm({
      han_muc_de_xuat: "",
      ngay_khao_sat: new Date().toISOString().slice(0, 10),
      kich_co_tom: "",
      ph: "",
      oxy_hoa_tan: "",
      ly_do_de_xuat: "",
      nhan_xet_khao_sat: "",
    });
  };

  const addFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      setAlert("Chỉ được chọn file ảnh JPG, PNG hoặc WEBP");
      return;
    }

    const nextFiles = imageFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviewFiles((prev) => [...prev, ...nextFiles].slice(0, 10));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const removePreviewFile = (index: number) => {
    setPreviewFiles((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async () => {
    if (!selectedProfile) {
      setAlert("Vui lòng chọn hồ sơ cần lập phiếu");
      return;
    }

    if (!form.han_muc_de_xuat || Number(form.han_muc_de_xuat) <= 0) {
      setAlert("Vui lòng nhập hạn mức đề xuất hợp lệ");
      return;
    }

    if (isOverPolicyLimit) {
      setAlert("Hạn mức đề xuất đang vượt quá hạn mức tối đa của chính sách");
      return;
    }

    if (!form.ly_do_de_xuat.trim()) {
      setAlert("Vui lòng nhập lý do đề xuất");
      return;
    }

    if (!confirmChecked) {
      setAlert("Vui lòng xác nhận đã khảo sát thực tế trước khi gửi");
      return;
    }

    try {
      setSubmitting(true);

      await staffAssessmentService.createLimitProposal({
        id_ho_so: selectedProfile.id_ho_so,
        id_chinh_sach:
          matchedPolicy?.id_chinh_sach || selectedProfile.id_chinh_sach || null,
        han_muc_de_xuat: form.han_muc_de_xuat,
        ly_do_de_xuat: form.ly_do_de_xuat,
        nhan_xet_khao_sat: form.nhan_xet_khao_sat,
        ph: form.ph,
        oxy_hoa_tan: form.oxy_hoa_tan,
        kich_co_tom: form.kich_co_tom,
        ngay_khao_sat: form.ngay_khao_sat,
        minh_chung_khao_sat: previewFiles.map((item) => item.file),
      });

      setAlert("Đã gửi phiếu đề xuất hạn mức cho Admin duyệt");
      resetForm();
      fetchData();
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể tạo phiếu đề xuất hạn mức"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="staff-create-proposal-page">
      <div className="staff-create-proposal-header">
        <div>
          <p>Nhân viên định mức</p>
          <h1>Tạo phiếu đề xuất hạn mức</h1>
          <span>
            Chọn hồ sơ đã khảo sát, nhập thông tin đề xuất và gửi Admin duyệt.
          </span>
        </div>
      </div>

      {alert && (
        <div className="staff-create-proposal-alert">
          <span>{alert}</span>
          <button type="button" onClick={() => setAlert("")}>
            ×
          </button>
        </div>
      )}

      <div className="staff-create-proposal-layout">
        <div className="staff-create-proposal-card">
          <div className="staff-create-proposal-card__top">
            <h2>Thông tin phiếu đề xuất</h2>
            <p>Nhập đầy đủ thông tin khảo sát trước khi gửi Admin.</p>
          </div>

          <div className="staff-create-proposal-form">
            <label className="staff-create-proposal-form__full">
              Hồ sơ cần đề xuất
              <select
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                disabled={loading}
              >
                <option value="">
                  {loading ? "Đang tải hồ sơ..." : "Chọn hồ sơ mua trả sau"}
                </option>
                {profiles.map((profile) => (
                  <option key={profile.id_ho_so} value={profile.id_ho_so}>
                    HS #{profile.id_ho_so} -{" "}
                    {profile.NguoiDung?.ho_ten || "Khách hàng"} -{" "}
                    {profile.AoNuoi?.ten_ao || "Ao nuôi"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Hạn mức hiện tại
              <input
                value={formatMoney(selectedProfile?.dinh_muc_cong_no)}
                disabled
              />
            </label>

            <label>
              Hạn mức đề xuất
              <input
                value={form.han_muc_de_xuat}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    han_muc_de_xuat: event.target.value,
                  }))
                }
                placeholder="VD: 50000000"
              />
            </label>

            <div className="proposal-policy-box">
              <div>
                <span>Chính sách áp dụng</span>
                <strong>{matchedPolicy?.ten_chinh_sach || "Chưa xác định"}</strong>
              </div>

              <div>
                <span>Giai đoạn</span>
                <strong>{matchedPolicy?.giai_doan || "—"}</strong>
              </div>

              <div>
                <span>Số ngày nuôi</span>
                <strong>{farmingDays !== null ? `${farmingDays} ngày` : "—"}</strong>
              </div>

              <div>
                <span>Hạn mức tối đa</span>
                <strong>
                  {matchedPolicy
                    ? formatMoney(matchedPolicy.han_muc_toi_da)
                    : "—"}
                </strong>
              </div>
            </div>

            {isOverPolicyLimit && (
              <div className="staff-create-proposal-warning">
                Hạn mức đề xuất vượt quá hạn mức tối đa của chính sách đang áp
                dụng.
              </div>
            )}

            <label>
              Ngày khảo sát
              <input
                type="date"
                value={form.ngay_khao_sat}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ngay_khao_sat: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Kích cỡ tôm
              <input
                value={form.kich_co_tom}
                onChange={(event) =>
                  setForm((prev) => ({
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
                value={form.ph}
                onChange={(event) =>
                  setForm((prev) => ({
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
                value={form.oxy_hoa_tan}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    oxy_hoa_tan: event.target.value,
                  }))
                }
                placeholder="VD: 5.2"
              />
            </label>

            <label className="staff-create-proposal-form__full">
              Minh chứng khảo sát
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                hidden
                id="survey-proof-files"
              />
              <label
                className="staff-create-proposal-upload"
                htmlFor="survey-proof-files"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <strong>Chọn hoặc kéo thả ảnh khảo sát</strong>
                <span>Hỗ trợ JPG, PNG, WEBP. Tối đa 10 ảnh.</span>
              </label>
            </label>

            {previewFiles.length > 0 && (
              <div className="staff-create-proposal-images">
                {previewFiles.map((item, index) => (
                  <div className="staff-create-proposal-image" key={item.url}>
                    <img src={item.url} alt={`Minh chứng ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removePreviewFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="staff-create-proposal-form__full">
              Lý do đề xuất
              <textarea
                value={form.ly_do_de_xuat}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ly_do_de_xuat: event.target.value,
                  }))
                }
                placeholder="Giải thích vì sao đề xuất hạn mức này: nhu cầu vật tư còn lại, tình trạng ao, khả năng thu hồi công nợ..."
              />
            </label>

            <label className="staff-create-proposal-form__full">
              Nhận xét khảo sát
              <textarea
                value={form.nhan_xet_khao_sat}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    nhan_xet_khao_sat: event.target.value,
                  }))
                }
                placeholder="Nhập nhận xét thực tế ao nuôi, lịch sử mua, khả năng thanh toán..."
              />
            </label>

            <label className="staff-create-proposal-confirm">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(event) => setConfirmChecked(event.target.checked)}
              />
              <span>
                Tôi xác nhận đã khảo sát thực tế và thông tin đề xuất là đúng
                theo kết quả thẩm định.
              </span>
            </label>
          </div>

          <div className="staff-create-proposal-actions">
            <button
              type="button"
              className="staff-create-proposal-secondary"
              onClick={resetForm}
            >
              Làm mới
            </button>

            <button
              type="button"
              className="staff-create-proposal-primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Gửi Admin duyệt"}
            </button>
          </div>
        </div>

        <div className="staff-create-proposal-preview">
          <h2>Thông tin hồ sơ</h2>

          {!selectedProfile ? (
            <div className="staff-create-proposal-empty">
              Chọn hồ sơ để xem thông tin tóm tắt.
            </div>
          ) : (
            <div className="staff-create-proposal-info">
              <div>
                <span>Mã hồ sơ</span>
                <strong>HS #{selectedProfile.id_ho_so}</strong>
              </div>

              <div>
                <span>Khách hàng</span>
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
                <span>Ao nuôi</span>
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
                <span>Vụ nuôi</span>
                <strong>{selectedProfile.VuNuoi?.ten_vu_nuoi || "—"}</strong>
              </div>

              <div>
                <span>Ngày thả giống</span>
                <strong>
                  {formatDate(selectedProfile.VuNuoi?.ngay_tha_giong)}
                </strong>
              </div>

              <div>
                <span>Ngày nuôi lúc khảo sát</span>
                <strong>{farmingDays !== null ? `${farmingDays} ngày` : "—"}</strong>
              </div>

              <div>
                <span>Hạn mức hiện tại</span>
                <strong>{formatMoney(selectedProfile.dinh_muc_cong_no)}</strong>
              </div>

              <div>
                <span>Chính sách phù hợp</span>
                <strong>{matchedPolicy?.ten_chinh_sach || "—"}</strong>
              </div>

              <div>
                <span>Trạng thái</span>
                <strong>{selectedProfile.trang_thai_ho_so}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}