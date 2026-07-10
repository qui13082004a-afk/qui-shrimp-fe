import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  limitProposalService,
  type LimitProposal,
} from "../../services/limitProposal.service";
import "./AdminCommon.css";
import "./AdminLimitProposalPage.css";

const statusLabel: Record<string, string> = {
  cho_duyet: "Chờ duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
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

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function AdminLimitProposalPage() {
  const [proposals, setProposals] = useState<LimitProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<LimitProposal | null>(
    null
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [approvedLimit, setApprovedLimit] = useState<number>(0);
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await limitProposalService.getAllProposals();
      setProposals(Array.isArray(res) ? res : res?.data || []);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Không tải được danh sách phiếu đề xuất hạn mức"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const filteredProposals = useMemo(() => {
    return proposals.filter((item) => {
      const customerName =
        item.HoSoKhachHang?.NguoiDung?.ho_ten ||
        item.NguoiDung?.ho_ten ||
        "";

      const searchText = `${item.id_phieu_de_xuat || ""} ${
        item.id_ho_so || ""
      } ${customerName} ${item.ly_do_de_xuat || ""} ${
        item.nhan_xet_khao_sat || ""
      }`.toLowerCase();

      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
      const matchStatus =
        statusFilter === "all" || item.trang_thai === statusFilter;

      return matchKeyword && matchStatus;
    });
  }, [proposals, keyword, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: proposals.length,
      pending: proposals.filter((item) => item.trang_thai === "cho_duyet")
        .length,
      approved: proposals.filter((item) => item.trang_thai === "da_duyet")
        .length,
      rejected: proposals.filter((item) => item.trang_thai === "tu_choi")
        .length,
    };
  }, [proposals]);

  const getCustomerName = (item: LimitProposal) => {
    return (
      item.HoSoKhachHang?.NguoiDung?.ho_ten ||
      item.NguoiDung?.ho_ten ||
      "Chưa có thông tin"
    );
  };

  const getPondName = (item: LimitProposal) => {
    return item.HoSoKhachHang?.AoNuoi?.ten_ao || "Chưa có ao";
  };

  const getCropSeasonName = (item: LimitProposal) => {
    return item.HoSoKhachHang?.VuNuoi?.ten_vu_nuoi || "Chưa có vụ nuôi";
  };

  const openDetail = (proposal: LimitProposal) => {
    setSelectedProposal(proposal);
    setApprovedLimit(Number(proposal.han_muc_de_xuat || 0));
    setPaymentDueDate(
      toDateInputValue(proposal.HoSoKhachHang?.han_thanh_toan || null)
    );
    setApproveNote(proposal.HoSoKhachHang?.ghi_chu || "");
    setRejectReason("");
    setShowRejectModal(false);
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setSelectedProposal(null);
    setApprovedLimit(0);
    setPaymentDueDate("");
    setApproveNote("");
    setRejectReason("");
    setShowDetailModal(false);
    setShowRejectModal(false);
  };

  const handleApprove = async () => {
    if (!selectedProposal?.id_phieu_de_xuat) {
      setMessage("Không tìm thấy mã phiếu đề xuất");
      return;
    }

    if (approvedLimit <= 0) {
      setMessage("Hạn mức được duyệt phải lớn hơn 0");
      return;
    }

    if (!paymentDueDate) {
      setMessage("Vui lòng chọn hạn thanh toán cho hồ sơ");
      return;
    }

    try {
      setProcessing(true);

      await limitProposalService.approveProposal(
        selectedProposal.id_phieu_de_xuat,
        {
          han_muc_duoc_duyet: approvedLimit,
          han_thanh_toan: paymentDueDate,
          ghi_chu: approveNote.trim() || undefined,
        }
      );

      setMessage("Duyệt phiếu đề xuất hạn mức thành công");
      closeDetail();
      fetchProposals();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Duyệt phiếu thất bại");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedProposal?.id_phieu_de_xuat) {
      setMessage("Không tìm thấy mã phiếu đề xuất");
      return;
    }

    if (!rejectReason.trim()) {
      setMessage("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setProcessing(true);

      await limitProposalService.rejectProposal(
        selectedProposal.id_phieu_de_xuat,
        {
          ly_do_tu_choi: rejectReason.trim(),
        }
      );

      setMessage("Từ chối phiếu đề xuất hạn mức thành công");
      closeDetail();
      fetchProposals();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Từ chối phiếu thất bại");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="admin-page limit-proposal-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Phiếu đề xuất</p>
          <h1>Quản lý phiếu đề xuất hạn mức</h1>
          <p>
            Admin xem xét, duyệt hoặc từ chối hạn mức do nhân viên định mức đề
            xuất.
          </p>
        </div>
      </div>

      {message && (
        <div className="admin-alert limit-proposal-alert">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <div className="limit-proposal-stats">
        <div className="limit-proposal-stat-card">
          <span>Tổng phiếu</span>
          <strong>{stats.total}</strong>
          <p>Toàn bộ phiếu đề xuất</p>
        </div>

        <div className="limit-proposal-stat-card">
          <span>Chờ duyệt</span>
          <strong>{stats.pending}</strong>
          <p>Cần Admin xử lý</p>
        </div>

        <div className="limit-proposal-stat-card">
          <span>Đã duyệt</span>
          <strong>{stats.approved}</strong>
          <p>Đã mở hạn mức</p>
        </div>

        <div className="limit-proposal-stat-card">
          <span>Từ chối</span>
          <strong>{stats.rejected}</strong>
          <p>Không đủ điều kiện</p>
        </div>
      </div>

      <div className="admin-card limit-proposal-card">
        <div className="limit-proposal-card__top">
          <div>
            <h2>Danh sách phiếu đề xuất</h2>
            <p>
              Theo dõi hạn mức hiện tại, hạn mức đề xuất, khảo sát ao nuôi và
              trạng thái xử lý.
            </p>
          </div>
        </div>

        <div className="admin-toolbar limit-proposal-toolbar">
          <input
            value={keyword}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setKeyword(event.target.value)
            }
            placeholder="Tìm theo mã phiếu, khách hàng, hồ sơ, lý do..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="cho_duyet">Chờ duyệt</option>
            <option value="da_duyet">Đã duyệt</option>
            <option value="tu_choi">Từ chối</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table limit-proposal-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Ao / Vụ nuôi</th>
                <th>Hạn mức hiện tại</th>
                <th>Hạn mức đề xuất</th>
                <th>Ngày đề xuất</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="limit-proposal-empty">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="limit-proposal-empty">
                      <strong>Chưa có phiếu đề xuất phù hợp</strong>
                      <span>Hãy thay đổi từ khóa tìm kiếm hoặc bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((item) => (
                  <tr key={item.id_phieu_de_xuat}>
                    <td>
                      <strong>#{item.id_phieu_de_xuat}</strong>
                      <span>Hồ sơ #{item.id_ho_so}</span>
                    </td>

                    <td>
                      <strong>{getCustomerName(item)}</strong>
                      <span>
                        {item.HoSoKhachHang?.NguoiDung?.so_dien_thoai ||
                          "Chưa có SĐT"}
                      </span>
                    </td>

                    <td>
                      <strong>{getPondName(item)}</strong>
                      <span>{getCropSeasonName(item)}</span>
                    </td>

                    <td>{formatCurrency(item.han_muc_hien_tai)}</td>

                    <td>
                      <strong>{formatCurrency(item.han_muc_de_xuat)}</strong>
                    </td>

                    <td>{formatDate(item.ngay_de_xuat)}</td>

                    <td>
                      <span className={`admin-badge ${item.trang_thai}`}>
                        {statusLabel[item.trang_thai || ""] || "Chưa rõ"}
                      </span>
                    </td>

                    <td>
                      <div className="limit-proposal-actions">
                        <button onClick={() => openDetail(item)}>
                          Xem chi tiết
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

      {showDetailModal && selectedProposal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal limit-proposal-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Chi tiết phiếu đề xuất hạn mức</h2>
                <p>
                  Kiểm tra thông tin khảo sát và quyết định hạn mức được duyệt.
                </p>
              </div>

              <button className="admin-modal__close" onClick={closeDetail}>
                ×
              </button>
            </div>

            <div className="limit-proposal-detail">
              <div className="limit-proposal-detail__main">
                <div className="limit-proposal-section">
                  <h3>Thông tin phiếu</h3>

                  <div className="limit-proposal-info-grid">
                    <div>
                      <span>Mã phiếu</span>
                      <strong>#{selectedProposal.id_phieu_de_xuat}</strong>
                    </div>

                    <div>
                      <span>Mã hồ sơ</span>
                      <strong>#{selectedProposal.id_ho_so}</strong>
                    </div>

                    <div>
                      <span>Ngày đề xuất</span>
                      <strong>{formatDate(selectedProposal.ngay_de_xuat)}</strong>
                    </div>

                    <div>
                      <span>Ngày duyệt</span>
                      <strong>{formatDate(selectedProposal.ngay_duyet)}</strong>
                    </div>
                  </div>
                </div>

                <div className="limit-proposal-section">
                  <h3>Thông tin khách hàng</h3>

                  <div className="limit-proposal-info-grid">
                    <div>
                      <span>Khách hàng</span>
                      <strong>{getCustomerName(selectedProposal)}</strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>
                      <strong>
                        {selectedProposal.HoSoKhachHang?.NguoiDung
                          ?.so_dien_thoai || "Chưa có"}
                      </strong>
                    </div>

                    <div>
                      <span>Ao nuôi</span>
                      <strong>{getPondName(selectedProposal)}</strong>
                    </div>

                    <div>
                      <span>Vụ nuôi</span>
                      <strong>{getCropSeasonName(selectedProposal)}</strong>
                    </div>
                  </div>
                </div>

                <div className="limit-proposal-section">
                  <h3>Hạn mức</h3>

                  <div className="limit-proposal-money-grid">
                    <div className="limit-proposal-money-box">
                      <span>Hạn mức hiện tại</span>
                      <strong>
                        {formatCurrency(selectedProposal.han_muc_hien_tai)}
                      </strong>
                    </div>

                    <div className="limit-proposal-money-box primary">
                      <span>Hạn mức đề xuất</span>
                      <strong>
                        {formatCurrency(selectedProposal.han_muc_de_xuat)}
                      </strong>
                    </div>
                  </div>

                  <div className="limit-proposal-info-grid">
                    <div>
                      <span>Hạn mức đã duyệt</span>
                      <strong>
                        {selectedProposal.han_muc_duoc_duyet
                          ? formatCurrency(selectedProposal.han_muc_duoc_duyet)
                          : "Chưa duyệt"}
                      </strong>
                    </div>

                    <div>
                      <span>Hạn thanh toán hồ sơ</span>
                      <strong>
                        {formatDate(
                          selectedProposal.HoSoKhachHang?.han_thanh_toan
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="limit-proposal-section">
                  <h3>Thông tin khảo sát</h3>

                  <div className="limit-proposal-info-grid">
                    <div>
                      <span>pH</span>
                      <strong>{selectedProposal.ph || "Chưa có"}</strong>
                    </div>

                    <div>
                      <span>Oxy hòa tan</span>
                      <strong>
                        {selectedProposal.oxy_hoa_tan
                          ? `${selectedProposal.oxy_hoa_tan} mg/L`
                          : "Chưa có"}
                      </strong>
                    </div>

                    <div>
                      <span>Kích cỡ tôm</span>
                      <strong>
                        {selectedProposal.kich_co_tom || "Chưa có"}
                      </strong>
                    </div>

                    <div>
                      <span>Hình ảnh khảo sát</span>
                      <strong>
                        {selectedProposal.hinh_anh_khao_sat
                          ? "Đã có minh chứng"
                          : "Chưa có"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="limit-proposal-section">
                  <h3>Lý do / Nhận xét</h3>

                  <div className="limit-proposal-note">
                    <span>Lý do đề xuất</span>
                    <p>
                      {selectedProposal.ly_do_de_xuat ||
                        "Chưa có lý do đề xuất"}
                    </p>
                  </div>

                  <div className="limit-proposal-note">
                    <span>Nhận xét khảo sát</span>
                    <p>
                      {selectedProposal.nhan_xet_khao_sat ||
                        "Chưa có nhận xét khảo sát"}
                    </p>
                  </div>

                  {selectedProposal.ly_do_tu_choi && (
                    <div className="limit-proposal-note danger">
                      <span>Lý do từ chối</span>
                      <p>{selectedProposal.ly_do_tu_choi}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedProposal.trang_thai === "cho_duyet" && (
                <div className="limit-proposal-approval-box">
                  <h3>Xử lý phiếu</h3>

                  <label>
                    Hạn mức được duyệt
                    <input
                      type="number"
                      min={0}
                      value={approvedLimit}
                      onChange={(event) =>
                        setApprovedLimit(Number(event.target.value))
                      }
                    />
                  </label>

                  <label>
                    Hạn thanh toán
                    <input
                      type="date"
                      value={paymentDueDate}
                      onChange={(event) => setPaymentDueDate(event.target.value)}
                    />
                  </label>

                  <label>
                    Ghi chú khi duyệt
                    <textarea
                      value={approveNote}
                      onChange={(event) => setApproveNote(event.target.value)}
                      placeholder="Nhập ghi chú nội bộ nếu cần..."
                    />
                  </label>

                  <div className="limit-proposal-approval-actions">
                    <button
                      className="admin-secondary-btn"
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                    >
                      Từ chối
                    </button>

                    <button
                      className="admin-primary-btn"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing ? "Đang xử lý..." : "Duyệt phiếu"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedProposal && (
        <div className="admin-modal-overlay">
          <div className="limit-proposal-confirm">
            <div className="limit-proposal-confirm__icon">!</div>

            <h2>Từ chối phiếu đề xuất?</h2>
            <p>
              Vui lòng nhập rõ lý do để nhân viên định mức và khách hàng biết vì
              sao hồ sơ chưa được mở hạn mức.
            </p>

            <form onSubmit={handleReject}>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Nhập lý do từ chối..."
              />

              <div className="limit-proposal-confirm__actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="admin-primary-btn danger"
                  disabled={processing}
                >
                  {processing ? "Đang xử lý..." : "Xác nhận từ chối"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}