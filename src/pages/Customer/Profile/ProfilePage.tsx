import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Edit3,
  Lock,
  FileText,
  TrendingDown,
  Waves,
  Loader2,
  Eye,
  EyeOff,
  Camera,
  ShoppingBag,
} from "lucide-react";
import { toastSuccess, toastError } from "../../../utils/notify";
import OrderPage from "../Order/OrderPage";
import "./ProfilePage.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface UserProfile {
  id_nguoi_dung: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  vai_tro: "admin" | "khach_hang" | "nhan_vien_giao_hang";
  dia_chi: string;
  tinh_thanh: string;
  anh_dai_dien: string | null;
  trang_thai_tai_khoan: "chua_xac_thuc" | "hoat_dong" | "khoa";
}

interface Pond {
  id_ao: number;
  id_nguoi_dung: number;
  ten_ao: string;
  dien_tich: number;
  dia_chi_ao?: string;
  loai_hinh_nuoi?: string;
  trang_thai_ao: "dang_hoat_dong" | "tam_ngung";
  ghi_chu?: string;
  ngay_tao: string;
}

interface CreditProfile {
  id_ho_so: number;
  id_nguoi_dung: number;
  id_ao: number;
  id_vu_nuoi: number;
  dinh_muc_cong_no: number;
  duoc_phep_tra_sau: boolean;
  han_thanh_toan?: string;
  ngay_duyet?: string;
  ghi_chu?: string;
  VuNuoi?: {
    ten_vu_nuoi: string;
  };
  CropSeason?: {
    ten_vu_nuoi: string;
  };
}

type ActiveTab = "info" | "orders" | "security" | "shrimp-farm";

type EditForm = {
  ho_ten: string;
  so_dien_thoai: string;
  dia_chi: string;
  tinh_thanh: string;
};

type PasswordForm = {
  mat_khau_cu: string;
  mat_khau_moi: string;
  xac_nhan_mat_khau: string;
};

type ShowPassword = {
  cu: boolean;
  moi: boolean;
  xac_nhan: boolean;
};

const roleLabel: Record<UserProfile["vai_tro"], string> = {
  admin: "Quản trị viên",
  khach_hang: "Khách hàng",
  nhan_vien_giao_hang: "Nhân viên giao hàng",
};

const LoadingScreen = () => (
  <div className="spinner-wrapper">
    <Loader2 className="spinner-icon" />
    <p className="spinner-text">Đang load thông tin Nhà Nông...</p>
  </div>
);

const ProfileBanner = ({
  profile,
  submitting,
  onAvatarChange,
}: {
  profile: UserProfile | null;
  submitting: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="profile-banner">
    <div className="banner-background-wave">
      <Waves className="banner-wave-icon" />
    </div>

    <div className="banner-content">
      <div className="avatar-section">
        <img
          src={
            profile?.anh_dai_dien ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
          }
          alt={profile?.ho_ten || "Avatar"}
          className="avatar-image"
        />

        <label className="avatar-upload-btn">
          <Camera className="icon-sm" />
          <input
            type="file"
            accept="image/*"
            className="hidden-file-input"
            onChange={onAvatarChange}
            disabled={submitting}
          />
        </label>
      </div>

      <div className="user-meta-info">
        <div className="user-name-wrapper">
          <h1 className="user-name">
            {profile?.ho_ten || "Thành viên Đất Tôm"}
          </h1>
          <ShieldCheck className="verified-icon" />
        </div>

        <p className="user-role">
          Vai trò:{" "}
          {profile?.vai_tro ? roleLabel[profile.vai_tro] : "Khách hàng"}
        </p>

        <span className="status-badge">
          Trạng thái:{" "}
          {profile?.trang_thai_tai_khoan === "hoat_dong"
            ? "Đã xác thực"
            : "Chưa kích hoạt"}
        </span>
      </div>
    </div>
  </div>
);

const ProfileSidebar = ({
  activeTab,
  onChangeTab,
}: {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}) => (
  <div className="profile-sidebar">
    <nav className="sidebar-menu">
      <button
        onClick={() => onChangeTab("info")}
        className={`sidebar-item ${activeTab === "info" ? "active" : ""}`}
      >
        <UserIcon className="sidebar-icon" />
        <span>Thông tin cá nhân</span>
      </button>

      <button
        onClick={() => onChangeTab("orders")}
        className={`sidebar-item ${activeTab === "orders" ? "active" : ""}`}
      >
        <ShoppingBag className="sidebar-icon" />
        <span>Lịch sử mua hàng</span>
      </button>

      <button
        onClick={() => onChangeTab("security")}
        className={`sidebar-item ${activeTab === "security" ? "active" : ""}`}
      >
        <Lock className="sidebar-icon" />
        <span>Bảo mật tài khoản</span>
      </button>

      <button
        onClick={() => onChangeTab("shrimp-farm")}
        className={`sidebar-item ${
          activeTab === "shrimp-farm" ? "active" : ""
        }`}
      >
        <Waves className="sidebar-icon" />
        <span>Ao nuôi & Công nợ</span>
      </button>
    </nav>
  </div>
);

const InfoCard = ({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) => (
  <div className={`info-card-item ${className}`}>
    <span className="info-item-icon-wrap">{icon}</span>
    <div>
      <h4 className="info-item-label">{label}</h4>
      <p className="info-item-value">{value}</p>
    </div>
  </div>
);

const InfoTab = ({
  profile,
  editForm,
  isEditing,
  submitting,
  onEdit,
  onCancel,
  onChangeForm,
  onSubmit,
}: {
  profile: UserProfile | null;
  editForm: EditForm;
  isEditing: boolean;
  submitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onChangeForm: (form: EditForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <div>
    <div className="panel-header">
      <div>
        <h2 className="panel-title">Chi tiết thông tin cá nhân</h2>
        <p className="panel-subtitle">
          Địa chỉ đầm ao chính xác hỗ trợ nhân viên vận chuyển vật tư tốt hơn
        </p>
      </div>

      {!isEditing && (
        <button onClick={onEdit} className="edit-btn">
          <Edit3 className="icon-sm" />
          <span>Chỉnh sửa</span>
        </button>
      )}
    </div>

    {isEditing ? (
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Họ và tên người nuôi tôm</label>
            <input
              type="text"
              value={editForm.ho_ten}
              onChange={(e) =>
                onChangeForm({ ...editForm, ho_ten: e.target.value })
              }
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại liên hệ</label>
            <input
              type="tel"
              value={editForm.so_dien_thoai}
              onChange={(e) =>
                onChangeForm({ ...editForm, so_dien_thoai: e.target.value })
              }
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tỉnh / Thành phố vùng nuôi</label>
            <input
              type="text"
              value={editForm.tinh_thanh}
              onChange={(e) =>
                onChangeForm({ ...editForm, tinh_thanh: e.target.value })
              }
              required
              placeholder="Cà Mau, Bạc Liêu, Sóc Trăng..."
              className="form-input"
            />
          </div>

          <div className="form-group form-span-2">
            <label className="form-label">Địa chỉ nhà / Đầm ao chi tiết</label>
            <textarea
              value={editForm.dia_chi}
              onChange={(e) =>
                onChangeForm({ ...editForm, dia_chi: e.target.value })
              }
              required
              rows={3}
              className="form-textarea no-resize"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Hủy bỏ
          </button>

          <button type="submit" disabled={submitting} className="save-btn">
            {submitting && <Loader2 className="spin-icon-sm" />}
            <span>Lưu thông tin</span>
          </button>
        </div>
      </form>
    ) : (
      <div className="info-grid">
        <InfoCard
          icon={<UserIcon />}
          label="Họ và tên"
          value={profile?.ho_ten || "Chưa thiết lập"}
        />
        <InfoCard
          icon={<Phone />}
          label="Số điện thoại"
          value={profile?.so_dien_thoai || "Chưa thiết lập"}
        />
        <InfoCard
          icon={<Mail />}
          label="Địa chỉ email"
          value={profile?.email || "Chưa thiết lập"}
        />
        <InfoCard
          icon={<MapPin />}
          label="Tỉnh / Thành phố"
          value={profile?.tinh_thanh || "Chưa thiết lập"}
        />
        <InfoCard
          icon={<MapPin />}
          label="Địa chỉ nhận hàng"
          value={profile?.dia_chi || "Chưa thiết lập địa chỉ giao nhận vật tư"}
          className="form-span-2"
        />
      </div>
    )}
  </div>
);

const PasswordInput = ({
  label,
  typeKey,
  value,
  showPassword,
  onToggle,
  onChange,
}: {
  label: string;
  typeKey: keyof ShowPassword;
  value: string;
  showPassword: ShowPassword;
  onToggle: (value: ShowPassword) => void;
  onChange: (value: string) => void;
}) => (
  <div className="form-group security-field">
    <label className="form-label">{label}</label>

    <div className="password-input-wrapper">
      <input
        type={showPassword[typeKey] ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="form-input password-input"
      />

      <button
        type="button"
        onClick={() =>
          onToggle({ ...showPassword, [typeKey]: !showPassword[typeKey] })
        }
        className="password-toggle-btn"
      >
        {showPassword[typeKey] ? (
          <EyeOff className="icon-md" />
        ) : (
          <Eye className="icon-md" />
        )}
      </button>
    </div>
  </div>
);

const SecurityTab = ({
  passwordForm,
  showPassword,
  submitting,
  onChangePasswordForm,
  onChangeShowPassword,
  onSubmit,
}: {
  passwordForm: PasswordForm;
  showPassword: ShowPassword;
  submitting: boolean;
  onChangePasswordForm: (form: PasswordForm) => void;
  onChangeShowPassword: (value: ShowPassword) => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <div>
    <div className="panel-header">
      <div>
        <h2 className="panel-title">Mật khẩu và Bảo mật</h2>
        <p className="panel-subtitle">
          Nên thay đổi mật khẩu định kỳ để nâng cao tính bảo mật tài khoản
        </p>
      </div>
    </div>

    <form onSubmit={onSubmit} className="security-form">
      <PasswordInput
        label="Mật khẩu hiện tại"
        typeKey="cu"
        value={passwordForm.mat_khau_cu}
        showPassword={showPassword}
        onToggle={onChangeShowPassword}
        onChange={(value) =>
          onChangePasswordForm({ ...passwordForm, mat_khau_cu: value })
        }
      />

      <PasswordInput
        label="Mật khẩu mới"
        typeKey="moi"
        value={passwordForm.mat_khau_moi}
        showPassword={showPassword}
        onToggle={onChangeShowPassword}
        onChange={(value) =>
          onChangePasswordForm({ ...passwordForm, mat_khau_moi: value })
        }
      />

      <PasswordInput
        label="Xác nhận mật khẩu mới"
        typeKey="xac_nhan"
        value={passwordForm.xac_nhan_mat_khau}
        showPassword={showPassword}
        onToggle={onChangeShowPassword}
        onChange={(value) =>
          onChangePasswordForm({
            ...passwordForm,
            xac_nhan_mat_khau: value,
          })
        }
      />

      <div className="form-actions form-actions-left">
        <button type="submit" disabled={submitting} className="save-btn">
          {submitting && <Loader2 className="spin-icon-sm" />}
          <span>Cập nhật mật khẩu</span>
        </button>
      </div>
    </form>
  </div>
);

const ShrimpFarmTab = ({
  creditProfiles,
  ponds,
}: {
  creditProfiles: CreditProfile[];
  ponds: Pond[];
}) => (
  <div className="shrimp-farm-section">
    <div>
      <div className="panel-header panel-header-compact">
        <div>
          <h3 className="panel-title panel-title-icon">
            <TrendingDown className="panel-heading-icon" />
            <span>Hồ sơ công nợ mua trả sau</span>
          </h3>
          <p className="panel-subtitle">
            Hạn mức và kỳ hạn thanh toán mua thức ăn, chế phẩm sinh học được phê
            duyệt thực tế
          </p>
        </div>
      </div>

      {creditProfiles.length === 0 ? (
        <div className="empty-area">
          <FileText className="empty-icon" />
          <p className="empty-text">
            Bạn chưa đăng ký hoặc chưa được ban quản trị phê duyệt hồ sơ mua
            hàng trả sau.
          </p>
        </div>
      ) : (
        <div className="credit-card-list">
          {creditProfiles.map((cp) => (
            <div key={cp.id_ho_so} className="credit-card">
              <TrendingDown className="credit-bg-icon" />

              <div className="credit-card-header">
                <div>
                  <p className="credit-tag">Mã hồ sơ công nợ #{cp.id_ho_so}</p>
                  <h4 className="credit-title">
                    {cp.VuNuoi?.ten_vu_nuoi ||
                      cp.CropSeason?.ten_vu_nuoi ||
                      `Vụ nuôi liên kết (Mã vụ: ${cp.id_vu_nuoi})`}
                  </h4>
                </div>

                <span className="approved-badge">
                  {cp.duoc_phep_tra_sau ? "Đã duyệt trả sau" : "Đang thẩm định"}
                </span>
              </div>

              <div className="credit-details-row">
                <div>
                  <p className="credit-metric-label">Hạn mức tối đa</p>
                  <p className="credit-metric-value">
                    {Number(cp.dinh_muc_cong_no).toLocaleString("vi-VN")} đ
                  </p>
                </div>

                <div>
                  <p className="credit-metric-label">Trạng thái công nợ</p>
                  <div className="credit-metric-active">
                    <span
                      className={`active-dot ${
                        cp.duoc_phep_tra_sau ? "" : "danger"
                      }`}
                    />
                    <span>
                      {cp.duoc_phep_tra_sau
                        ? "Cho phép mua nợ"
                        : "Tạm khóa mua nợ"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="credit-metric-label">Kỳ tất toán</p>
                  <p className="credit-date-value">
                    {cp.han_thanh_toan
                      ? new Date(cp.han_thanh_toan).toLocaleDateString("vi-VN")
                      : "Chưa xác định"}
                  </p>
                </div>
              </div>

              {cp.ghi_chu && (
                <div className="credit-note">
                  <strong>Ghi chú phê duyệt:</strong> {cp.ghi_chu}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    <div>
      <div className="panel-header panel-header-compact">
        <div>
          <h3 className="panel-title panel-title-icon">
            <Waves className="panel-heading-icon" />
            <span>Danh sách ao đầm sở hữu</span>
          </h3>
          <p className="panel-subtitle">
            Quản lý và đối chiếu diện tích thả giống vùng nuôi thực tế của bạn
          </p>
        </div>
      </div>

      {ponds.length === 0 ? (
        <div className="empty-area">
          <Waves className="empty-icon" />
          <p className="empty-text">
            Bạn chưa thực hiện đăng ký ao nuôi nào trên hệ thống Đất Tôm.
          </p>
        </div>
      ) : (
        <div className="pond-cards-grid">
          {ponds.map((pond) => (
            <div key={pond.id_ao} className="pond-card">
              <div className="pond-card-header">
                <h4 className="pond-name">{pond.ten_ao}</h4>
                <span
                  className={`pond-status ${
                    pond.trang_thai_ao === "dang_hoat_dong"
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {pond.trang_thai_ao === "dang_hoat_dong"
                    ? "Đang nuôi"
                    : "Tạm ngưng"}
                </span>
              </div>

              <div className="pond-details">
                <div className="pond-detail-row">
                  <span className="pond-detail-label">Diện tích ao nuôi:</span>
                  <span className="pond-detail-value">
                    {Number(pond.dien_tich).toLocaleString("vi-VN")} m²
                  </span>
                </div>

                <div className="pond-detail-row">
                  <span className="pond-detail-label">Mô hình thả:</span>
                  <span className="pond-detail-value">
                    {pond.loai_hinh_nuoi || "Quảng canh tự nhiên"}
                  </span>
                </div>

                {pond.dia_chi_ao && (
                  <div className="pond-address">
                    <strong>Vị trí ao:</strong> {pond.dia_chi_ao}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [creditProfiles, setCreditProfiles] = useState<CreditProfile[]>([]);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditForm>({
    ho_ten: "",
    so_dien_thoai: "",
    dia_chi: "",
    tinh_thanh: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    mat_khau_cu: "",
    mat_khau_moi: "",
    xac_nhan_mat_khau: "",
  });

  const [showPassword, setShowPassword] = useState<ShowPassword>({
    cu: false,
    moi: false,
    xac_nhan: false,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const userRes = await api.get("/auth/me");

      if (userRes.data && userRes.data.success) {
        const userData = userRes.data.data;

        setProfile(userData);
        setEditForm({
          ho_ten: userData.ho_ten || "",
          so_dien_thoai: userData.so_dien_thoai || "",
          dia_chi: userData.dia_chi || "",
          tinh_thanh: userData.tinh_thanh || "",
        });
      } else {
        throw new Error("Không thể lấy thông tin phản hồi từ máy chủ.");
      }

      const [pondsRes, creditRes] = await Promise.all([
        api.get("/ponds/my"),
        api.get("/customer-profiles/my"),
      ]);

      if (pondsRes.data && pondsRes.data.success) {
        setPonds(pondsRes.data.data || []);
      }

      if (creditRes.data && creditRes.data.success) {
        setCreditProfiles(creditRes.data.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi lấy dữ liệu hồ sơ:", err);

      toastError(
        err.response?.data?.message ||
          "Không thể tải thông tin cá nhân. Vui lòng kiểm tra lại kết nối Backend!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.put("/auth/update-profile", editForm);

      if (response.data && response.data.success) {
        toastSuccess("Cập nhật thông tin cá nhân thành công!");
        setProfile((prev) => (prev ? { ...prev, ...editForm } : null));
        setIsEditing(false);
      }
    } catch (err: any) {
      toastError(
        err.response?.data?.message ||
          "Không thể cập nhật thông tin. Vui lòng kiểm tra lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.mat_khau_moi !== passwordForm.xac_nhan_mat_khau) {
      toastError("Mật khẩu mới và xác nhận mật khẩu không trùng khớp!");
      return;
    }

    if (passwordForm.mat_khau_moi.length < 6) {
      toastError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.put("/auth/change-password", {
        mat_khau_cu: passwordForm.mat_khau_cu,
        mat_khau_moi: passwordForm.mat_khau_moi,
      });

      if (response.data && response.data.success) {
        toastSuccess("Đổi mật khẩu tài khoản thành công!");
        setPasswordForm({
          mat_khau_cu: "",
          mat_khau_moi: "",
          xac_nhan_mat_khau: "",
        });
      }
    } catch (err: any) {
      toastError(
        err.response?.data?.message || "Mật khẩu hiện tại không chính xác."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();

    formData.append("image", file);
    setSubmitting(true);

    try {
      const uploadRes = await api.post("/single", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadRes.data && uploadRes.data.success) {
        const imageUrl = uploadRes.data.data.imageUrl;

        const updateRes = await api.put("/auth/update-profile", {
          anh_dai_dien: imageUrl,
        });

        if (updateRes.data && updateRes.data.success) {
          setProfile((prev) =>
            prev ? { ...prev, anh_dai_dien: imageUrl } : null
          );
          toastSuccess("Cập nhật ảnh đại diện cá nhân thành công!");
        }
      }
    } catch (err: any) {
      toastError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải ảnh đại diện lên hệ thống Cloudinary."
      );
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      ho_ten: profile?.ho_ten || "",
      so_dien_thoai: profile?.so_dien_thoai || "",
      dia_chi: profile?.dia_chi || "",
      tinh_thanh: profile?.tinh_thanh || "",
    });
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="profile-container">
      <ProfileBanner
        profile={profile}
        submitting={submitting}
        onAvatarChange={handleAvatarChange}
      />

      <div className="profile-grid">
        <ProfileSidebar activeTab={activeTab} onChangeTab={setActiveTab} />

        <div className="profile-content">
          {activeTab === "info" && (
            <InfoTab
              profile={profile}
              editForm={editForm}
              isEditing={isEditing}
              submitting={submitting}
              onEdit={() => setIsEditing(true)}
              onCancel={handleCancelEdit}
              onChangeForm={setEditForm}
              onSubmit={handleUpdateProfile}
            />
          )}

          {activeTab === "orders" && <OrderPage />}

          {activeTab === "security" && (
            <SecurityTab
              passwordForm={passwordForm}
              showPassword={showPassword}
              submitting={submitting}
              onChangePasswordForm={setPasswordForm}
              onChangeShowPassword={setShowPassword}
              onSubmit={handleChangePassword}
            />
          )}

          {activeTab === "shrimp-farm" && (
            <ShrimpFarmTab creditProfiles={creditProfiles} ponds={ponds} />
          )}
        </div>
      </div>
    </div>
  );
}