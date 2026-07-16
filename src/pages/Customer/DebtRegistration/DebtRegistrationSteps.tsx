import React from "react";
import type { Province, Ward } from "../../../services/location.service";

export type FileField =
  | "anh_cccd_mat_truoc"
  | "anh_cccd_mat_sau"
  | "anh_bien_lai_tha_giong";

export interface DebtRegistrationFormState {
  ho_ten: string;
  ngay_sinh: string;
  so_cccd: string;
  so_dien_thoai: string;
  zalo: string;
  dia_chi_thuong_tru: string;
  tinh_thanh_ao: string;
  quan_huyen_ao: string;
  phuong_xa_ao: string;
  dia_chi_chi_tiet_ao: string;
  dien_tich_ao: string;
  don_vi_dien_tich: string;
  so_vu_nuoi_moi_nam: string;
  san_luong_du_kien: string;
  don_vi_san_luong: string;
  kinh_nghiem_nuoi_nam: string;
  nguon_thu_nhap_tra_no: string;
  nguoi_mua_tom_du_kien: string;
  ngay_thu_hoach_du_kien: string;
  han_muc_mong_muon: string;
  thoi_han_tra_mong_muon: string;
  don_vi_thoi_han: string;
  mat_hang_du_kien: string;
  nguoi_bao_lanh_ho_ten: string;
  nguoi_bao_lanh_sdt: string;
  nguoi_bao_lanh_cccd: string;
  nguoi_bao_lanh_quan_he: string;
  ghi_chu: string;
  cam_ket_thong_tin: boolean;
  dong_y_xac_minh: boolean;
  dong_y_dieu_khoan: boolean;
}

interface StepContentProps {
  step: number;
  form: DebtRegistrationFormState;
  files: Record<FileField, File | null>;
  pondImages: File[];
  pondName: string;
  cropName: string;
  areaChecked: boolean;
  areaSupported: boolean;
  checkingArea: boolean;
  isAreaAutoFilled: boolean;
  isHarvestDateAutoFilled: boolean;
  loadingPondCropInfo: boolean;
  provinceOptions: Province[];
  wardOptions: Ward[];
  selectedProvinceId: string;
  loadingProvinces: boolean;
  loadingWards: boolean;
  updateField: <K extends keyof DebtRegistrationFormState>(
    field: K,
    value: DebtRegistrationFormState[K]
  ) => void;
  onSelectProvince: (provinceId: string) => void;
  onSelectWard: (wardId: string) => void;
  setFile: (field: FileField, file: File | null) => void;
  setPondImages: (files: File[]) => void;
  onCheckArea: () => void;
}

const Field: React.FC<{
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}> = ({ label, hint, full, children }) => (
  <label className={`debt-register-field ${full ? "is-full" : ""}`}>
    <span className="debt-register-field__label">{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);

const LockedField: React.FC<{
  label: string;
  source: string;
  value: React.ReactNode;
  loading?: boolean;
}> = ({ label, source, value, loading }) => (
  <div className="debt-register-field debt-register-field--locked">
    <span className="debt-register-field__label">
      {label} <em className="debt-register-field__source">{source}</em>
    </span>
    <div className="debt-register-field__locked-value">
      <span>{loading ? "Đang tải dữ liệu..." : value}</span>
      <small>{loading ? "..." : "Khóa"}</small>
    </div>
  </div>
);

const FileCard: React.FC<{
  title: string;
  description: string;
  file: File | null;
  accept?: string;
  onChange: (file: File | null) => void;
}> = ({ title, description, file, accept = "image/*", onChange }) => (
  <label className={`debt-upload-card ${file ? "has-file" : ""}`}>
    <input
      type="file"
      accept={accept}
      onChange={(event) => onChange(event.target.files?.[0] || null)}
    />
    <span className="debt-upload-card__icon">{file ? "✓" : "+"}</span>
    <strong>{title}</strong>
    <small>{file?.name || description}</small>
    <em>{file ? "Chọn lại ảnh" : "Chọn ảnh"}</em>
  </label>
);

const formatMoney = (value: string) => {
  const number = Number(value.replace(/\D/g, ""));
  return number ? number.toLocaleString("vi-VN") : "";
};

export const DebtRegistrationStepContent: React.FC<StepContentProps> = ({
  step,
  form,
  files,
  pondImages,
  pondName,
  cropName,
  areaChecked,
  areaSupported,
  checkingArea,
  isAreaAutoFilled,
  isHarvestDateAutoFilled,
  loadingPondCropInfo,
  provinceOptions,
  wardOptions,
  selectedProvinceId,
  loadingProvinces,
  loadingWards,
  updateField,
  onSelectProvince,
  onSelectWard,
  setFile,
  setPondImages,
  onCheckArea,
}) => {
  if (step === 1) {
    return (
      <section className="debt-register-section">
        <div className="debt-register-section__heading">
          <span>01</span>
          <div>
            <h3>Thông tin cá nhân</h3>
            <p>Thông tin phải trùng khớp với giấy tờ tùy thân của khách hàng.</p>
          </div>
        </div>

        <div className="debt-register-grid">
          <Field label="Họ và tên *">
            <input value={form.ho_ten} onChange={(e) => updateField("ho_ten", e.target.value)} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Ngày sinh *">
            <input type="date" value={form.ngay_sinh} onChange={(e) => updateField("ngay_sinh", e.target.value)} />
          </Field>
          <Field label="Số CCCD *" hint="Nhập 9 hoặc 12 chữ số">
            <input inputMode="numeric" maxLength={12} value={form.so_cccd} onChange={(e) => updateField("so_cccd", e.target.value.replace(/\D/g, ""))} placeholder="079095001234" />
          </Field>
          <Field label="Số điện thoại *">
            <input inputMode="tel" maxLength={10} value={form.so_dien_thoai} onChange={(e) => updateField("so_dien_thoai", e.target.value.replace(/\D/g, ""))} placeholder="0901234567" />
          </Field>
          <Field label="Số Zalo">
            <input value={form.zalo} onChange={(e) => updateField("zalo", e.target.value)} placeholder="Có thể dùng cùng số điện thoại" />
          </Field>
          <Field label="Địa chỉ thường trú *" full>
            <textarea value={form.dia_chi_thuong_tru} onChange={(e) => updateField("dia_chi_thuong_tru", e.target.value)} placeholder="Số nhà, ấp/khóm, xã/phường, huyện/quận, tỉnh/thành" />
          </Field>
        </div>
      </section>
    );
  }

  if (step === 2) {
    return (
      <section className="debt-register-section">
        <div className="debt-register-section__heading">
          <span>02</span>
          <div>
            <h3>Ao nuôi và khu vực hỗ trợ</h3>
            <p>Hệ thống kiểm tra theo nơi đặt ao nuôi, không theo địa chỉ thường trú.</p>
          </div>
        </div>

        <div className="debt-context-card">
          <div><small>Ao nuôi</small><strong>{pondName}</strong></div>
          <div><small>Vụ nuôi</small><strong>{cropName}</strong></div>
        </div>

        <div className="debt-register-grid">
          <Field label="Tỉnh/Thành phố *">
            <select
              value={selectedProvinceId}
              onChange={(e) => onSelectProvince(e.target.value)}
              disabled={loadingProvinces}
            >
              <option value="">
                {loadingProvinces ? "Đang tải tỉnh/thành..." : "Chọn tỉnh/thành"}
              </option>
              {provinceOptions.map((province) => (
                <option key={province.id_tinh_thanh} value={province.id_tinh_thanh}>
                  {province.ten_tinh}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phường/Xã *">
            <select
              value={wardOptions.find((ward) => ward.ten_xa === form.phuong_xa_ao)?.id_phuong_xa || ""}
              onChange={(e) => onSelectWard(e.target.value)}
              disabled={!selectedProvinceId || loadingWards}
            >
              <option value="">
                {!selectedProvinceId
                  ? "Chọn tỉnh/thành trước"
                  : loadingWards
                    ? "Đang tải phường/xã..."
                    : "Chọn phường/xã"}
              </option>
              {wardOptions.map((ward) => (
                <option key={ward.id_phuong_xa} value={ward.id_phuong_xa}>
                  {ward.cap_xa ? `${ward.cap_xa} ${ward.ten_xa}` : ward.ten_xa}
                </option>
              ))}
            </select>
          </Field>
          {isAreaAutoFilled || loadingPondCropInfo ? (
            <LockedField
              label="Diện tích ao *"
              source="(lấy từ ao nuôi)"
              loading={loadingPondCropInfo}
              value={form.dien_tich_ao ? `${form.dien_tich_ao} ${form.don_vi_dien_tich === "ha" ? "ha" : "m²"}` : "Chưa có dữ liệu ao nuôi"}
            />
          ) : (
            <Field label="Diện tích ao *" hint="Không lấy được từ ao nuôi, vui lòng nhập tay">
              <div className="debt-register-combo">
                <input type="number" min="1" value={form.dien_tich_ao} onChange={(e) => updateField("dien_tich_ao", e.target.value)} />
                <select value={form.don_vi_dien_tich} onChange={(e) => updateField("don_vi_dien_tich", e.target.value)}><option value="m2">m²</option><option value="ha">ha</option></select>
              </div>
            </Field>
          )}
          <Field label="Địa chỉ chi tiết ao *" full>
            <textarea value={form.dia_chi_chi_tiet_ao} onChange={(e) => updateField("dia_chi_chi_tiet_ao", e.target.value)} placeholder="Số nhà, ấp/khóm, tuyến đường, mốc nhận diện gần nhất..." />
          </Field>
        </div>
        {isAreaAutoFilled && (
          <p className="debt-register-hint">
            Diện tích ao được lấy tự động từ hồ sơ ao nuôi để tránh lệch dữ liệu. Nếu diện tích thực tế đã thay đổi, vui lòng cập nhật ở phần quản lý ao nuôi trước khi đăng ký.
          </p>
        )}

        <div className="debt-area-check">
          <div>
            <strong>Kiểm tra điều kiện khu vực</strong>
            <span>Vui lòng kiểm tra trước khi chuyển sang bước tiếp theo.</span>
          </div>
          <button type="button" onClick={onCheckArea} disabled={checkingArea}>{checkingArea ? "Đang kiểm tra..." : "Kiểm tra khu vực"}</button>
        </div>

        {areaChecked && (
          <div className={`debt-area-result ${areaSupported ? "is-success" : "is-danger"}`}>
            <span>{areaSupported ? "✓" : "!"}</span>
            <div><strong>{areaSupported ? "Khu vực được hỗ trợ trả sau" : "Khu vực chưa được hỗ trợ"}</strong><small>{areaSupported ? "Bạn có thể tiếp tục hoàn thiện hồ sơ." : "Vui lòng liên hệ đại lý để được hướng dẫn thêm."}</small></div>
          </div>
        )}
      </section>
    );
  }

  if (step === 3) {
    return (
      <section className="debt-register-section">
        <div className="debt-register-section__heading"><span>03</span><div><h3>Hoạt động nuôi tôm</h3><p>Thông tin dùng để đánh giá quy mô vụ nuôi và nguồn trả nợ.</p></div></div>
        <div className="debt-register-grid">
          <Field label="Số vụ nuôi mỗi năm *"><input type="number" min="1" value={form.so_vu_nuoi_moi_nam} onChange={(e) => updateField("so_vu_nuoi_moi_nam", e.target.value)} /></Field>
          <Field label="Kinh nghiệm nuôi (năm) *"><input type="number" min="0" value={form.kinh_nghiem_nuoi_nam} onChange={(e) => updateField("kinh_nghiem_nuoi_nam", e.target.value)} /></Field>
          <Field label="Sản lượng dự kiến *">
            <div className="debt-register-combo"><input type="number" min="1" value={form.san_luong_du_kien} onChange={(e) => updateField("san_luong_du_kien", e.target.value)} /><select value={form.don_vi_san_luong} onChange={(e) => updateField("don_vi_san_luong", e.target.value)}><option value="kg">kg</option><option value="tan">tấn</option></select></div>
          </Field>
          {isHarvestDateAutoFilled || loadingPondCropInfo ? (
            <LockedField
              label="Ngày thu hoạch dự kiến *"
              source="(lấy từ vụ nuôi)"
              loading={loadingPondCropInfo}
              value={form.ngay_thu_hoach_du_kien || "Chưa có dữ liệu vụ nuôi"}
            />
          ) : (
            <Field label="Ngày thu hoạch dự kiến *" hint="Không lấy được từ vụ nuôi, vui lòng nhập tay">
              <input type="date" value={form.ngay_thu_hoach_du_kien} onChange={(e) => updateField("ngay_thu_hoach_du_kien", e.target.value)} />
            </Field>
          )}
          <Field label="Nguồn thu nhập trả nợ *" full><textarea value={form.nguon_thu_nhap_tra_no} onChange={(e) => updateField("nguon_thu_nhap_tra_no", e.target.value)} placeholder="Ví dụ: tiền bán tôm sau thu hoạch" /></Field>
          <Field label="Người mua tôm dự kiến" full><input value={form.nguoi_mua_tom_du_kien} onChange={(e) => updateField("nguoi_mua_tom_du_kien", e.target.value)} placeholder="Tên thương lái hoặc công ty thu mua" /></Field>
        </div>
      </section>
    );
  }

  if (step === 4) {
    return (
      <section className="debt-register-section">
        <div className="debt-register-section__heading"><span>04</span><div><h3>Nhu cầu mua trả sau</h3><p>Hạn mức thực tế sẽ do nhân viên đề xuất và Admin phê duyệt.</p></div></div>
        <div className="debt-register-grid">
          <Field label="Hạn mức mong muốn *"><div className="debt-register-money"><input inputMode="numeric" value={formatMoney(form.han_muc_mong_muon)} onChange={(e) => updateField("han_muc_mong_muon", e.target.value.replace(/\D/g, ""))} placeholder="50.000.000" /><span>VNĐ</span></div></Field>
          <Field label="Thời hạn mong muốn *"><div className="debt-register-combo"><input type="number" min="1" value={form.thoi_han_tra_mong_muon} onChange={(e) => updateField("thoi_han_tra_mong_muon", e.target.value)} /><select value={form.don_vi_thoi_han} onChange={(e) => updateField("don_vi_thoi_han", e.target.value)}><option value="thang">Tháng</option><option value="ngay">Ngày</option></select></div></Field>
          <Field label="Mặt hàng dự kiến mua *" full><textarea value={form.mat_hang_du_kien} onChange={(e) => updateField("mat_hang_du_kien", e.target.value)} placeholder="Thức ăn, thuốc, hóa chất..." /></Field>
        </div>

        <div className="debt-register-subheading"><h4>Người bảo lãnh / liên hệ khẩn cấp</h4><p>Không bắt buộc, nhưng nên bổ sung khi đề nghị hạn mức lớn.</p></div>
        <div className="debt-register-grid">
          <Field label="Họ và tên">
            <input
              value={form.nguoi_bao_lanh_ho_ten}
              onChange={(e) =>
                updateField(
                  "nguoi_bao_lanh_ho_ten",
                  e.target.value.replace(/[^A-Za-zÀ-ỹ\s]/g, "")
                )
              }
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              inputMode="tel"
              maxLength={10}
              value={form.nguoi_bao_lanh_sdt}
              onChange={(e) =>
                updateField(
                  "nguoi_bao_lanh_sdt",
                  e.target.value.replace(/\D/g, "")
                )
              }
              placeholder="0901234567"
            />
          </Field>
          <Field label="Số CCCD">
            <input
              inputMode="numeric"
              maxLength={12}
              value={form.nguoi_bao_lanh_cccd}
              onChange={(e) =>
                updateField(
                  "nguoi_bao_lanh_cccd",
                  e.target.value.replace(/\D/g, "")
                )
              }
              placeholder="079095001234"
            />
          </Field>
          <Field label="Quan hệ với khách hàng">
            <input
              value={form.nguoi_bao_lanh_quan_he}
              onChange={(e) =>
                updateField(
                  "nguoi_bao_lanh_quan_he",
                  e.target.value.replace(/[^A-Za-zÀ-ỹ\s]/g, "")
                )
              }
              placeholder="Vợ/chồng, người thân..."
            />
          </Field>
          <Field label="Ghi chú bổ sung" full><textarea value={form.ghi_chu} onChange={(e) => updateField("ghi_chu", e.target.value)} /></Field>
        </div>
      </section>
    );
  }

  return (
    <section className="debt-register-section">
      <div className="debt-register-section__heading"><span>05</span><div><h3>Minh chứng và cam kết</h3><p>Ảnh rõ nét, đủ góc và không bị che khuất.</p></div></div>
      <div className="debt-upload-grid">
        <FileCard title="CCCD mặt trước *" description="Ảnh rõ số và thông tin trên CCCD" file={files.anh_cccd_mat_truoc} onChange={(file) => setFile("anh_cccd_mat_truoc", file)} />
        <FileCard title="CCCD mặt sau *" description="Ảnh rõ ngày cấp và mã QR" file={files.anh_cccd_mat_sau} onChange={(file) => setFile("anh_cccd_mat_sau", file)} />
        <FileCard title="Biên lai thả giống *" description="Ảnh biên lai hoặc chứng từ" file={files.anh_bien_lai_tha_giong} onChange={(file) => setFile("anh_bien_lai_tha_giong", file)} />
        <label className={`debt-upload-card ${pondImages.length ? "has-file" : ""}`}>
          <input type="file" accept="image/*" multiple onChange={(e) => setPondImages(Array.from(e.target.files || []).slice(0, 5))} />
          <span className="debt-upload-card__icon">{pondImages.length ? "✓" : "+"}</span>
          <strong>Ảnh ao nuôi</strong>
          <small>{pondImages.length ? `${pondImages.length} ảnh đã chọn` : "Tối đa 5 ảnh thực tế"}</small>
          <em>{pondImages.length ? "Chọn lại ảnh" : "Chọn ảnh"}</em>
        </label>
      </div>

      <div className="debt-commitment-box">
        <div><strong>Cam kết của khách hàng</strong><span>Vui lòng đọc và xác nhận đầy đủ trước khi gửi.</span></div>
        <label><input type="checkbox" checked={form.cam_ket_thong_tin} onChange={(e) => updateField("cam_ket_thong_tin", e.target.checked)} /><span>Tôi cam kết các thông tin đã cung cấp là đúng sự thật.</span></label>
        <label><input type="checkbox" checked={form.dong_y_xac_minh} onChange={(e) => updateField("dong_y_xac_minh", e.target.checked)} /><span>Tôi đồng ý để đại lý liên hệ và xác minh thực tế ao nuôi khi cần.</span></label>
        <label><input type="checkbox" checked={form.dong_y_dieu_khoan} onChange={(e) => updateField("dong_y_dieu_khoan", e.target.checked)} /><span>Tôi đồng ý tuân thủ điều khoản mua hàng trả sau nếu hồ sơ được duyệt.</span></label>
      </div>
    </section>
  );
};

