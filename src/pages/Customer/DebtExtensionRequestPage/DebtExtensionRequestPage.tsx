import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { customerProfileService } from "../../../services/customerProfile.service";
import { debtExtensionService } from "../../../services/debtExtension.service";
import { toastError, toastSuccess, toastWarning } from "../../../utils/notify";
import "./DebtExtensionRequestPage.css";

const DebtExtensionRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [hanDeXuat, setHanDeXuat] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [loading, setLoading] = useState(false);

  const formatDate = (date?: string | null) => {
    if (!date) return "--/--/----";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatCurrency = (value?: string | number | null) => {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;

      try {
        const res = await customerProfileService.getCustomerProfileById(id);
        setProfile(res.data);
      } catch (error) {
        console.error(error);
        toastError("Không thể tải hồ sơ công nợ.");
        navigate(-1);
      }
    };

    loadProfile();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hanDeXuat) {
      toastWarning("Vui lòng chọn hạn thanh toán đề xuất.");
      return;
    }

    if (!lyDo.trim()) {
      toastWarning("Vui lòng nhập lý do xin gia hạn.");
      return;
    }

    try {
      setLoading(true);

      const res = await debtExtensionService.createRequest({
        id_ho_so: Number(id),
        han_de_xuat: hanDeXuat,
        ly_do: lyDo,
      });

      if (!res.success) {
        toastError(res.message || "Gửi đơn thất bại.");
        return;
      }

      toastSuccess("Gửi đơn xin gia hạn thành công.");
      navigate(-1);
    } catch (error: any) {
      toastError(error.response?.data?.message || "Không thể gửi đơn gia hạn.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <div className="debt-extension-loading">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="debt-extension-page">
      <button className="debt-extension-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Quay lại
      </button>

      <div className="debt-extension-layout">
        <section className="debt-extension-card">
          <div className="debt-extension-header">
            <span>ĐƠN XIN GIA HẠN</span>
            <h1>Gia hạn thời hạn thanh toán</h1>
            <p>
              Gửi yêu cầu gia hạn hạn thanh toán công nợ. Chỉ được gửi khi còn
              tối đa 7 ngày đến hạn.
            </p>
          </div>

          <form className="debt-extension-form" onSubmit={handleSubmit}>
            <div className="debt-extension-current">
              <span>Hạn thanh toán hiện tại</span>
              <strong>
                {formatDate(profile.han_thanh_toan_hien_tai)}
              </strong>
            </div>

            <div className="form-group">
              <label>Hạn thanh toán đề xuất</label>
              <div className="input-icon">
                <CalendarDays size={18} />
                <input
                  type="date"
                  value={hanDeXuat}
                  onChange={(e) => setHanDeXuat(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Lý do xin gia hạn</label>
              <textarea
                rows={6}
                value={lyDo}
                onChange={(e) => setLyDo(e.target.value)}
                placeholder="Ví dụ: Vụ nuôi chưa đến kỳ thu hoạch, cần thêm thời gian xoay vòng vốn..."
              />
            </div>

            <button className="debt-extension-submit" disabled={loading}>
              <Send size={18} />
              {loading ? "Đang gửi..." : "Gửi đơn gia hạn"}
            </button>
          </form>
        </section>

        <aside className="debt-extension-preview">
          <h2>Thông tin hồ sơ</h2>

          <div>
            <span>Ao nuôi</span>
            <strong>{profile.AoNuoi?.ten_ao || "--"}</strong>
          </div>

          <div>
            <span>Vụ nuôi</span>
            <strong>{profile.VuNuoi?.ten_vu_nuoi || "--"}</strong>
          </div>

          <div>
            <span>Định mức công nợ</span>
            <strong>{formatCurrency(profile.dinh_muc_cong_no)}</strong>
          </div>

          <div>
            <span>Hạn gốc</span>
            <strong>{formatDate(profile.han_thanh_toan_goc)}</strong>
          </div>

          <div>
            <span>Hạn hiện tại</span>
            <strong>{formatDate(profile.han_thanh_toan_hien_tai)}</strong>
          </div>

          {profile.gia_han_moi_nhat && (
            <div className="extension-success-box">
              <span>Gia hạn gần nhất</span>
              <strong>
                {formatDate(profile.gia_han_moi_nhat.han_de_xuat)}
              </strong>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DebtExtensionRequestPage;
