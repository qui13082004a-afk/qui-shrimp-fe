import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  debtService,
  type DebtProfileDetail,
  type DebtTransaction,
} from "../../../services/debt.service";
import {
  debtExtensionService,
  type DebtExtension,
} from "../../../services/debtExtension.service";
import { toastError, toastWarning } from "../../../utils/notify";
import "./DebtDetailPage.css";

type DebtProfileDetailWithExtension = DebtProfileDetail & {
  id_ho_so?: number;
  han_thanh_toan_hien_tai?: string | null;
  han_thanh_toan_goc?: string | null;
  gia_han_moi_nhat?: any;
};

const formatCurrency = (value?: number | string | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDate = (date?: string | null) => {
  if (!date) return "--/--/----";
  return new Date(date).toLocaleDateString("vi-VN");
};

const getExtensionStatusText = (status: string) => {
  const map: Record<string, string> = {
    cho_duyet: "Chờ duyệt",
    da_duyet: "Đã duyệt",
    tu_choi: "Từ chối",
  };

  return map[status] || status;
};

export default function DebtDetailPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DebtProfileDetailWithExtension | null>(
    null
  );
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
const [extensions, setExtensions] = useState<DebtExtension[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, [profileId]);

  const loadData = async () => {
    if (!profileId) return;

    try {
      setLoading(true);

   const [detailRes, transRes, extensionRes] = await Promise.all([
  debtService.getDebtProfileDetail(profileId),
  debtService.getDebtProfileTransactions(profileId),
  debtExtensionService.getDebtExtensionsByProfileId(profileId),
]);

      if (detailRes.success) setDetail(detailRes.data);
      if (transRes.success) setTransactions(transRes.data || []);
      if (extensionRes.success) setExtensions(extensionRes.data || []);
    } catch (error) {
      console.error(error);
      toastError("Không thể tải chi tiết công nợ.");
    } finally {
      setLoading(false);
    }
  };

  const getPayableDebt = () => {
    if (!detail) return 0;

    return Number(detail.cong_no_hien_tai || 0);
  };

  const openPayModal = () => {
    const debt = getPayableDebt();

    if (debt <= 0) {
      toastWarning("Hồ sơ này không có công nợ cần thanh toán.");
      return;
    }

    setPayAmount(String(debt));
    setShowPayModal(true);
  };

  const handlePayDebtProfile = async () => {
    const amount = Number(payAmount);
    const debt = getPayableDebt();

    if (!profileId) {
      toastError("Không tìm thấy hồ sơ công nợ.");
      return;
    }

    if (!amount || amount <= 0) {
      toastWarning("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (amount > debt) {
      toastWarning("Số tiền thanh toán không được vượt quá công nợ hồ sơ này.");
      return;
    }

    try {
      setPaying(true);

      const res = await debtService.payPartialDebt(amount, Number(profileId));

      if (!res.data?.checkoutUrl) {
        toastError("Không nhận được link thanh toán.");
        return;
      }

      window.location.href = res.data.checkoutUrl;
    } catch (error: any) {
      toastError(error.response?.data?.message || "Không thể tạo thanh toán công nợ.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="debt-detail-loading">Đang tải chi tiết công nợ...</div>
    );
  }

  if (!detail) {
    return (
      <div className="debt-detail-loading">Không tìm thấy hồ sơ công nợ.</div>
    );
  }

  const currentDeadline =
    detail.han_thanh_toan_hien_tai || detail.han_thanh_toan;

  const hasPendingExtension = extensions.some(
    (item) => item.trang_thai === "cho_duyet"
  );

  const payableDebt = getPayableDebt();

  return (
    <div className="debt-detail-page">
      <button className="debt-detail-back" onClick={() => navigate(-1)}>
        ← Quay lại
      </button>

      <div className="debt-detail-header">
        <div>
          <span>CHI TIẾT CÔNG NỢ</span>
          <h1>{detail.ten_ao}</h1>
          <p>{detail.ten_vu_nuoi || "Chưa có vụ nuôi"}</p>
        </div>

        <div className="debt-detail-actions">
          <button
            className="debt-extension-btn"
            disabled={hasPendingExtension}
            onClick={() => navigate(`/debt-extension/${profileId}`)}
          >
            {hasPendingExtension ? "Đang chờ duyệt" : "Xin gia hạn"}
          </button>

          <button
            className="debt-pay-btn"
            type="button"
            onClick={openPayModal}
            disabled={payableDebt <= 0}
          >
            Thanh toán ngay
          </button>
        </div>
      </div>

      <div className="debt-detail-grid">
        <section className="debt-detail-card main-card">
          <h2>Tổng quan hạn mức</h2>

          <div className="big-debt-number">
            {formatCurrency(payableDebt)}
            <span>Công nợ hiện tại</span>
          </div>

          <div className="detail-progress">
            <div style={{ width: `${detail.phan_tram_su_dung || 0}%` }} />
          </div>

          <div className="detail-money-grid">
            <div>
              <span>Định mức</span>
              <strong>{formatCurrency(detail.dinh_muc_cong_no)}</strong>
            </div>

            <div>
              <span>Đang giữ hạn mức</span>
              <strong>{formatCurrency(detail.dang_giu_han_muc)}</strong>
            </div>

            <div>
              <span>Đã sử dụng</span>
              <strong>{formatCurrency(detail.da_su_dung)}</strong>
            </div>

            <div>
              <span>Còn khả dụng</span>
              <strong>{formatCurrency(detail.con_lai)}</strong>
            </div>
          </div>

          <div className="debt-reality-note">
            <strong>Công nợ hiện tại</strong> là khoản có thể thanh toán.
            <span>
              Phần đang giữ hạn mức chỉ là đơn mua trả sau chưa chuyển thành
              công nợ thực tế.
            </span>
          </div>
        </section>

        <section className="debt-detail-card">
          <h2>Thông tin ao/vụ nuôi</h2>

          <div className="info-list">
            <div>
              <span>Diện tích</span>
              <strong>{detail.dien_tich || "--"} m²</strong>
            </div>

            <div>
              <span>Loại hình nuôi</span>
              <strong>{detail.loai_hinh_nuoi || "--"}</strong>
            </div>

            <div>
              <span>Ngày thả giống</span>
              <strong>{formatDate(detail.ngay_tha_giong)}</strong>
            </div>

            <div>
              <span>Số lượng giống</span>
              <strong>
                {detail.so_luong_giong
                  ? Number(detail.so_luong_giong).toLocaleString("vi-VN")
                  : "--"}
              </strong>
            </div>

            <div>
              <span>Hạn thanh toán hiện tại</span>
              <strong>{formatDate(currentDeadline)}</strong>
            </div>

            {detail.han_thanh_toan_goc && (
              <div>
                <span>Hạn thanh toán gốc</span>
                <strong>{formatDate(detail.han_thanh_toan_goc)}</strong>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="debt-detail-card">
        <div className="transaction-head">
          <h2>Lịch sử gia hạn</h2>
          <span>{extensions.length} yêu cầu</span>
        </div>

        {extensions.length === 0 ? (
          <div className="extension-empty">Chưa có yêu cầu gia hạn nào.</div>
        ) : (
          <div className="extension-timeline">
            {extensions.map((item) => (
              <div className="extension-item" key={item.id_gia_han}>
                <div className={`extension-dot ${item.trang_thai}`} />

                <div className="extension-content">
                  <div className="extension-top">
                    <strong>
                      {formatDate(item.han_cu)} → {formatDate(item.han_de_xuat)}
                    </strong>
                    <span className={`extension-status ${item.trang_thai}`}>
                      {getExtensionStatusText(item.trang_thai)}
                    </span>
                  </div>

                  <p>{item.ly_do}</p>

                  <div className="extension-meta">
                    <span>Ngày gửi: {formatDate(item.ngay_gui)}</span>
                    <span>Số ngày gia hạn: {item.so_ngay_gia_han} ngày</span>
                  </div>

                  {item.ly_do_tu_choi && (
                    <div className="extension-reject">
                      Lý do từ chối: {item.ly_do_tu_choi}
                    </div>
                  )}

                  {item.ghi_chu && (
                    <div className="extension-note">
                      Ghi chú: {item.ghi_chu}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="debt-detail-card">
        <div className="transaction-head">
          <h2>Lịch sử phát sinh</h2>
          <span>{transactions.length} giao dịch</span>
        </div>

        <div className="transaction-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Nội dung</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    Chưa có phát sinh công nợ.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.ngay)}</td>
                    <td>{item.noi_dung}</td>
                    <td>
                      <span
                        className={
                          item.loai === "mua_hang"
                            ? "type-buy"
                            : "type-payment"
                        }
                      >
                        {item.loai === "mua_hang" ? "Mua hàng" : "Thanh toán"}
                      </span>
                    </td>
                    <td
                      className={
                        item.so_tien < 0 ? "money-minus" : "money-plus"
                      }
                    >
                      {item.so_tien < 0 ? "-" : "+"}
                      {formatCurrency(Math.abs(item.so_tien))}
                    </td>
                    <td>{item.trang_thai}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showPayModal && (
        <div className="debt-modal-overlay">
          <div className="debt-pay-modal">
            <h3>Thanh toán công nợ</h3>

            <p>
              Hồ sơ: <strong>{detail.ten_ao}</strong>
            </p>

            <p>
              Công nợ hiện tại có thể thanh toán:
              <strong> {formatCurrency(payableDebt)}</strong>
            </p>

            <div className="debt-reality-note modal-note">
              <strong>Chưa là nợ thật sự thì chưa thanh toán.</strong>
              <span>
                Hệ thống chỉ tạo thanh toán cho công nợ hiện tại, không trừ
                phần đang giữ hạn mức.
              </span>
            </div>

            <label>Số tiền thanh toán</label>

            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Nhập số tiền muốn thanh toán"
            />

            <div className="debt-modal-actions">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                disabled={paying}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handlePayDebtProfile}
                disabled={paying}
              >
                {paying ? "Đang tạo..." : "Thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
