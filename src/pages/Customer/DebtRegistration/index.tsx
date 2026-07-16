import React, { useEffect, useMemo, useState } from "react";
import { customerProfileService } from "../../../services/customerProfile.service";
import { pondService } from "../../../services/pond.service";
import { cropSeasonService } from "../../../services/cropSeason.service";
import {
  locationService,
  type Province,
  type Ward,
} from "../../../services/location.service";
import {
  DebtRegistrationStepContent,
  type DebtRegistrationFormState,
  type FileField,
} from "./DebtRegistrationSteps";
import "./DebtRegistration.css";

interface DebtRegistrationModalProps {
  isOpen: boolean;
  pondId: number;
  cropSeasonId: number;
  pondName: string;
  cropName: string;
  defaultPondArea?: number | string; // AoNuoi.dien_tich - không cho nhập tay để tránh lệch dữ liệu
  defaultPondAddress?: string; // AoNuoi.dia_chi_ao - gợi ý mặc định, khách vẫn có thể bổ sung chi tiết
  defaultHarvestDate?: string; // VuNuoi.ngay_thu_hoach_du_kien - lấy thẳng từ vụ nuôi, không cho nhập tay
  defaultFullName?: string;
  defaultPhone?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const stepMeta = [
  { label: "Cá nhân", short: "Thông tin" },
  { label: "Ao nuôi", short: "Khu vực" },
  { label: "Hoạt động", short: "Năng lực" },
  { label: "Nhu cầu", short: "Hạn mức" },
  { label: "Minh chứng", short: "Hoàn tất" },
];

const initialFiles: Record<FileField, File | null> = {
  anh_cccd_mat_truoc: null,
  anh_cccd_mat_sau: null,
  anh_bien_lai_tha_giong: null,
};

const parseDateOnly = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addYears = (date: Date, years: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

const validateBirthDate = (value: string) => {
  const birthDate = parseDateOnly(value);

  if (!birthDate) {
    return "Ngày sinh không hợp lệ.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate > today) {
    return "Ngày sinh không được lớn hơn ngày hiện tại.";
  }

  if (addYears(birthDate, 18) > today) {
    return "Khách hàng phải từ 18 tuổi trở lên.";
  }

  if (addYears(birthDate, 100) < today) {
    return "Tuổi khách hàng không được quá 100 tuổi.";
  }

  return "";
};

const isValidPersonName = (value: string) => {
  const name = value.trim().replace(/\s+/g, " ");
  return (
    name.length >= 2 &&
    name.length <= 100 &&
    /^[A-Za-zÀ-ỹ\s]+$/.test(name) &&
    /[A-Za-zÀ-ỹ]/.test(name)
  );
};

const validateGuarantorInfo = (form: DebtRegistrationFormState) => {
  const hasGuarantorInfo = [
    form.nguoi_bao_lanh_ho_ten,
    form.nguoi_bao_lanh_sdt,
    form.nguoi_bao_lanh_cccd,
    form.nguoi_bao_lanh_quan_he,
  ].some((value) => value.trim());

  if (!hasGuarantorInfo) return "";

  if (!isValidPersonName(form.nguoi_bao_lanh_ho_ten)) {
    return "Họ tên người bảo lãnh chỉ được nhập chữ, từ 2 đến 100 ký tự.";
  }

  if (!/^0\d{9}$/.test(form.nguoi_bao_lanh_sdt)) {
    return "Số điện thoại người bảo lãnh phải gồm 10 chữ số và bắt đầu bằng 0.";
  }

  if (!/^\d{9}$|^\d{12}$/.test(form.nguoi_bao_lanh_cccd)) {
    return "Số CCCD người bảo lãnh phải gồm 9 hoặc 12 chữ số.";
  }

  if (
    form.nguoi_bao_lanh_quan_he.trim() &&
    !isValidPersonName(form.nguoi_bao_lanh_quan_he)
  ) {
    return "Quan hệ với khách hàng chỉ được nhập chữ, từ 2 đến 100 ký tự.";
  }

  return "";
};

const createInitialForm = (
  fullName = "",
  phone = "",
  pondArea: number | string = "",
  pondAddress = "",
  harvestDate = ""
): DebtRegistrationFormState => ({
  ho_ten: fullName,
  ngay_sinh: "",
  so_cccd: "",
  so_dien_thoai: phone,
  zalo: phone,
  dia_chi_thuong_tru: "",
  tinh_thanh_ao: "",
  quan_huyen_ao: "",
  phuong_xa_ao: "",
  dia_chi_chi_tiet_ao: pondAddress,
  // Diện tích ao lấy trực tiếp từ AoNuoi (id_ao), không cho khách nhập tay
  // để tránh dữ liệu ao nuôi và hồ sơ khách hàng bị lệch nhau.
  dien_tich_ao: String(pondArea || ""),
  don_vi_dien_tich: "m2",
  so_vu_nuoi_moi_nam: "",
  san_luong_du_kien: "",
  don_vi_san_luong: "kg",
  kinh_nghiem_nuoi_nam: "",
  nguon_thu_nhap_tra_no: "",
  nguoi_mua_tom_du_kien: "",
  // Ngày thu hoạch dự kiến lấy trực tiếp từ VuNuoi (id_vu_nuoi), không cho
  // khách nhập tay vì đây là cùng một dữ liệu với vụ nuôi đã chọn.
  ngay_thu_hoach_du_kien: harvestDate,
  han_muc_mong_muon: "",
  thoi_han_tra_mong_muon: "",
  don_vi_thoi_han: "thang",
  mat_hang_du_kien: "",
  nguoi_bao_lanh_ho_ten: "",
  nguoi_bao_lanh_sdt: "",
  nguoi_bao_lanh_cccd: "",
  nguoi_bao_lanh_quan_he: "",
  ghi_chu: "",
  cam_ket_thong_tin: false,
  dong_y_xac_minh: false,
  dong_y_dieu_khoan: false,
});

export const DebtRegistrationModal: React.FC<DebtRegistrationModalProps> = ({
  isOpen,
  pondId,
  cropSeasonId,
  pondName,
  cropName,
  defaultPondArea,
  defaultPondAddress,
  defaultHarvestDate,
  defaultFullName,
  defaultPhone,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DebtRegistrationFormState>(() =>
    createInitialForm(defaultFullName, defaultPhone, defaultPondArea, defaultPondAddress, defaultHarvestDate)
  );
  const [files, setFiles] = useState<Record<FileField, File | null>>(initialFiles);
  const [pondImages, setPondImages] = useState<File[]>([]);
  const [areaChecked, setAreaChecked] = useState(false);
  const [areaSupported, setAreaSupported] = useState(false);
  const [checkingArea, setCheckingArea] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Diện tích ao và ngày thu hoạch dự kiến PHẢI lấy từ AoNuoi/VuNuoi thay vì
  // để khách gõ tay, vì đây là dữ liệu đã có sẵn ở ao/vụ nuôi đã chọn.
  // - true  => đã lấy được, hiển thị dạng khóa (read-only)
  // - false => không lấy được (null hoặc gọi API lỗi), mở cho nhập tay tạm thời
  const [loadingPondCropInfo, setLoadingPondCropInfo] = useState(false);
  const [isAreaAutoFilled, setIsAreaAutoFilled] = useState(true);
  const [isHarvestDateAutoFilled, setIsHarvestDateAutoFilled] = useState(true);
  const [provinceOptions, setProvinceOptions] = useState<Province[]>([]);
  const [wardOptions, setWardOptions] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await locationService.getProvinces();
        if (!cancelled) {
          setProvinceOptions(response.data || []);
        }
      } catch {
        if (!cancelled) {
          setProvinceOptions([]);
          setError("Không thể tải danh sách tỉnh/thành. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) setLoadingProvinces(false);
      }
    };

    void loadProvinces();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedProvinceId) {
      setWardOptions([]);
      return;
    }

    let cancelled = false;

    const loadWards = async () => {
      setLoadingWards(true);
      try {
        const response = await locationService.getWardsByProvince(selectedProvinceId);
        if (!cancelled) {
          setWardOptions(response.data || []);
        }
      } catch {
        if (!cancelled) {
          setWardOptions([]);
          setError("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) setLoadingWards(false);
      }
    };

    void loadWards();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedProvinceId]);

  useEffect(() => {
    if (!isOpen || !pondId || !cropSeasonId) return;

    let cancelled = false;

    const loadPondAndCropInfo = async () => {
      setLoadingPondCropInfo(true);
      try {
        const [pondResult, cropResult] = await Promise.allSettled([
          pondService.getMyPonds(),
          cropSeasonService.getCropSeasonsByPond(pondId),
        ]);

        if (cancelled) return;

        // --- Diện tích + địa chỉ ao: lấy từ AoNuoi (id_ao) ---
        let pondArea: number | string | undefined;
        let pondAddress: string | undefined;
        if (pondResult.status === "fulfilled") {
          const pond = pondResult.value.data?.find(
            (item) => Number(item.id_ao) === Number(pondId)
          );
          pondArea = pond?.dien_tich;
          pondAddress = pond?.dia_chi_ao;
        }

        const resolvedArea = pondArea ?? defaultPondArea;
        setIsAreaAutoFilled(resolvedArea !== undefined && resolvedArea !== null && resolvedArea !== "");
        setForm((current) => ({
          ...current,
          dien_tich_ao: resolvedArea !== undefined && resolvedArea !== null ? String(resolvedArea) : current.dien_tich_ao,
          // Chỉ điền gợi ý địa chỉ chi tiết nếu khách chưa tự gõ gì vào ô này.
          dia_chi_chi_tiet_ao: current.dia_chi_chi_tiet_ao || pondAddress || defaultPondAddress || "",
        }));

        // --- Ngày thu hoạch dự kiến: lấy từ VuNuoi (id_vu_nuoi) ---
        let harvestDate: string | undefined;
        if (cropResult.status === "fulfilled") {
          const season = cropResult.value.data?.find(
            (item) => Number(item.id_vu_nuoi) === Number(cropSeasonId)
          );
          harvestDate = season?.ngay_thu_hoach_du_kien;
        }

        const resolvedHarvestDate = harvestDate ?? defaultHarvestDate;
        setIsHarvestDateAutoFilled(Boolean(resolvedHarvestDate));
        setForm((current) => ({
          ...current,
          ngay_thu_hoach_du_kien: resolvedHarvestDate || current.ngay_thu_hoach_du_kien,
        }));
      } finally {
        if (!cancelled) setLoadingPondCropInfo(false);
      }
    };

    loadPondAndCropInfo();

    return () => {
      cancelled = true;
    };
  }, [isOpen, pondId, cropSeasonId, defaultPondArea, defaultPondAddress, defaultHarvestDate]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setError("");
    setAreaChecked(false);
    setAreaSupported(false);
    setSelectedProvinceId("");
    setWardOptions([]);
    setFiles(initialFiles);
    setPondImages([]);
    setForm(createInitialForm(defaultFullName, defaultPhone, defaultPondArea, defaultPondAddress, defaultHarvestDate));
  }, [isOpen, defaultFullName, defaultPhone, defaultPondArea, defaultPondAddress, defaultHarvestDate]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, submitting, onClose]);

  const updateField = <K extends keyof DebtRegistrationFormState>(
    field: K,
    value: DebtRegistrationFormState[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    if (["tinh_thanh_ao", "quan_huyen_ao", "phuong_xa_ao"].includes(field)) {
      setAreaChecked(false);
      setAreaSupported(false);
    }
  };

  const handleSelectProvince = (provinceId: string) => {
    const province = provinceOptions.find(
      (item) => String(item.id_tinh_thanh) === provinceId
    );

    setSelectedProvinceId(provinceId);
    setWardOptions([]);
    setForm((current) => ({
      ...current,
      tinh_thanh_ao: province?.ten_tinh || "",
      quan_huyen_ao: province ? "Theo don vi hanh chinh 34 tinh" : "",
      phuong_xa_ao: "",
    }));
    setAreaChecked(false);
    setAreaSupported(false);
    setError("");
  };

  const handleSelectWard = (wardId: string) => {
    const ward = wardOptions.find(
      (item) => String(item.id_phuong_xa) === wardId
    );

    setForm((current) => ({
      ...current,
      phuong_xa_ao: ward?.ten_xa || "",
    }));
    setAreaChecked(false);
    setAreaSupported(false);
    setError("");
  };

  const validateCurrentStep = () => {
    if (step === 1 && (!form.ho_ten.trim() || !form.ngay_sinh || !/^\d{9,12}$/.test(form.so_cccd) || !/^0\d{9}$/.test(form.so_dien_thoai) || !form.dia_chi_thuong_tru.trim())) {
      return "Vui lòng nhập đầy đủ và đúng thông tin cá nhân.";
    }
    if (step === 1) {
      const birthDateError = validateBirthDate(form.ngay_sinh);
      if (birthDateError) return birthDateError;
    }
    if (step === 2 && (!form.tinh_thanh_ao.trim() || !form.phuong_xa_ao.trim() || !form.dia_chi_chi_tiet_ao.trim())) {
      return "Vui lòng nhập đầy đủ địa chỉ ao nuôi.";
    }
    if (step === 2 && Number(form.dien_tich_ao) <= 0) {
      return isAreaAutoFilled
        ? "Không lấy được diện tích ao nuôi. Vui lòng đóng form và chọn lại ao nuôi."
        : "Vui lòng nhập diện tích ao nuôi.";
    }
    if (step === 2 && (!areaChecked || !areaSupported)) {
      return "Bạn cần kiểm tra và xác nhận khu vực được hỗ trợ.";
    }
    if (step === 3 && (Number(form.so_vu_nuoi_moi_nam) <= 0 || Number(form.san_luong_du_kien) <= 0 || Number(form.kinh_nghiem_nuoi_nam) < 0 || !form.nguon_thu_nhap_tra_no.trim())) {
      return "Vui lòng nhập đầy đủ thông tin hoạt động nuôi tôm.";
    }
    if (step === 3 && !form.ngay_thu_hoach_du_kien) {
      return isHarvestDateAutoFilled
        ? "Không lấy được ngày thu hoạch dự kiến. Vui lòng đóng form và chọn lại vụ nuôi."
        : "Vui lòng nhập ngày thu hoạch dự kiến.";
    }
    if (step === 4 && (Number(form.han_muc_mong_muon) <= 0 || Number(form.thoi_han_tra_mong_muon) <= 0 || !form.mat_hang_du_kien.trim())) {
      return "Vui lòng nhập đầy đủ nhu cầu mua trả sau.";
    }
    if (step === 4) {
      const guarantorError = validateGuarantorInfo(form);
      if (guarantorError) return guarantorError;
    }
    if (step === 5 && Object.values(files).some((file) => !file)) {
      return "Vui lòng tải đủ CCCD và biên lai thả giống.";
    }
    if (step === 5 && (!form.cam_ket_thong_tin || !form.dong_y_xac_minh || !form.dong_y_dieu_khoan)) {
      return "Bạn cần đồng ý đầy đủ các cam kết trước khi gửi.";
    }
    return "";
  };

  const handleCheckArea = async () => {
    if (!form.tinh_thanh_ao.trim() || !form.phuong_xa_ao.trim()) {
      setError("Vui lòng nhập tỉnh, huyện và xã trước khi kiểm tra.");
      return;
    }
    try {
      setCheckingArea(true);
      setError("");
      const result = await customerProfileService.checkSupportedArea({
        tinh_thanh: form.tinh_thanh_ao,
        quan_huyen: form.quan_huyen_ao,
        phuong_xa: form.phuong_xa_ao,
      });
      const supported = Boolean(result.data.duoc_ho_tro);
      setAreaChecked(true);
      setAreaSupported(supported);
      if (!supported) setError("Khu vực ao nuôi hiện chưa nằm trong vùng hỗ trợ mua trả sau.");
    } catch (requestError: any) {
      setAreaChecked(true);
      setAreaSupported(false);
      setError(requestError?.response?.data?.message || "Không thể kiểm tra khu vực lúc này.");
    } finally {
      setCheckingArea(false);
    }
  };

  const handleNext = () => {
    const validationError = validateCurrentStep();
    if (validationError) return setError(validationError);
    setError("");
    setStep((current) => Math.min(current + 1, stepMeta.length));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedPondId = Number(pondId);
    const normalizedCropSeasonId = Number(cropSeasonId);

    if (
      !Number.isInteger(normalizedPondId) ||
      normalizedPondId <= 0 ||
      !Number.isInteger(normalizedCropSeasonId) ||
      normalizedCropSeasonId <= 0
    ) {
      setError(
        "Không xác định được ao nuôi hoặc vụ nuôi. Vui lòng đóng form và chọn lại vụ nuôi."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data = new FormData();

      // Hai trường bắt buộc phải có để backend tìm đúng ao và vụ nuôi.
      data.append("id_ao", String(normalizedPondId));
      data.append("id_vu_nuoi", String(normalizedCropSeasonId));

      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          data.append(key, String(value));
        }
      });

      Object.entries(files).forEach(([key, file]) => {
        if (file instanceof File) {
          data.append(key, file);
        }
      });

      pondImages.forEach((file) => {
        if (file instanceof File) {
          data.append("anh_ao_nuoi", file);
        }
      });

      // QUAN TRỌNG: dùng customerProfileService.create(data) thay vì
      // axiosClient.post trực tiếp, vì hàm này set đúng
      // Content-Type: multipart/form-data. Nếu gọi axiosClient.post thẳng,
      // interceptor mặc định sẽ ép Content-Type JSON và làm hỏng các File
      // (mọi trường ảnh sẽ bị gửi lên dưới dạng "{}" rỗng).
      await customerProfileService.create(data);

      onSuccess?.();
      onClose();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Gửi hồ sơ thất bại. Vui lòng kiểm tra lại dữ liệu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => `${(step / stepMeta.length) * 100}%`, [step]);
  if (!isOpen) return null;

  return (
    <div className="debt-register-overlay" onMouseDown={() => !submitting && onClose()}>
      <div className="debt-register-modal" onMouseDown={(event) => event.stopPropagation()}>
        <aside className="debt-register-sidebar">
          <div className="debt-register-brand"><span>DT</span><div><strong>Đăng ký trả sau</strong><small>Hồ sơ khách hàng</small></div></div>
          <div className="debt-register-summary"><small>Đang đăng ký cho</small><strong>{pondName}</strong><span>{cropName}</span></div>
          <nav>
            {stepMeta.map((item, index) => {
              const number = index + 1;
              return (
                <div key={item.label} className={`debt-register-nav-item ${number === step ? "is-active" : ""} ${number < step ? "is-complete" : ""}`}>
                  <span>{number < step ? "✓" : number}</span>
                  <div><strong>{item.label}</strong><small>{item.short}</small></div>
                </div>
              );
            })}
          </nav>
          <div className="debt-register-note"><span>i</span><p>Thông tin của bạn chỉ được dùng cho việc xét duyệt mua trả sau.</p></div>
        </aside>

        <main className="debt-register-main">
          <header className="debt-register-header">
            <div><span>BƯỚC {step}/{stepMeta.length}</span><h2>Phiếu đăng ký mua hàng trả sau</h2><p>Hoàn thiện hồ sơ để đại lý xem xét và phê duyệt hạn mức.</p></div>
            <button type="button" onClick={onClose} disabled={submitting} aria-label="Đóng">×</button>
          </header>

          <div className="debt-register-mobile-progress"><div><span style={{ width: progress }} /></div><small>{stepMeta[step - 1].label}</small></div>

          <form onSubmit={handleSubmit}>
            <div className="debt-register-content">
              <DebtRegistrationStepContent
                step={step}
                form={form}
                files={files}
                pondImages={pondImages}
                pondName={pondName}
                cropName={cropName}
                areaChecked={areaChecked}
                areaSupported={areaSupported}
                checkingArea={checkingArea}
                isAreaAutoFilled={isAreaAutoFilled}
                isHarvestDateAutoFilled={isHarvestDateAutoFilled}
                loadingPondCropInfo={loadingPondCropInfo}
                provinceOptions={provinceOptions}
                wardOptions={wardOptions}
                selectedProvinceId={selectedProvinceId}
                loadingProvinces={loadingProvinces}
                loadingWards={loadingWards}
                updateField={updateField}
                onSelectProvince={handleSelectProvince}
                onSelectWard={handleSelectWard}
                setFile={(field, file) => setFiles((current) => ({ ...current, [field]: file }))}
                setPondImages={setPondImages}
                onCheckArea={handleCheckArea}
              />
            </div>

            {error && <div className="debt-register-error"><span>!</span><p>{error}</p></div>}

            <footer className="debt-register-actions">
              <button type="button" className="is-secondary" onClick={step === 1 ? onClose : () => { setError(""); setStep((current) => current - 1); }} disabled={submitting}>{step === 1 ? "Hủy" : "Quay lại"}</button>
              {step < stepMeta.length ? (
                <button type="button" className="is-primary" onClick={handleNext}>Tiếp tục <span>→</span></button>
              ) : (
                <button type="submit" className="is-primary" disabled={submitting}>{submitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}</button>
              )}
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
};

