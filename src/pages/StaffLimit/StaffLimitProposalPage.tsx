import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../lib/axios";
import "./StaffLimitProposalPage.css";

type ProposalStatus = "cho_duyet" | "da_duyet" | "tu_choi";

type Proposal = {
  id_phieu_de_xuat: number;
  id_ho_so: number;
  han_muc_hien_tai: number | string;
  han_muc_de_xuat: number | string;
  han_muc_duoc_duyet?: number | string | null;
  ly_do_de_xuat: string;
  nhan_xet_khao_sat?: string | null;
  trang_thai: ProposalStatus;
  ly_do_tu_choi?: string | null;
  ngay_de_xuat?: string;
  ngay_duyet?: string | null;
  HoSoKhachHang?: {
    NguoiDung?: {
      ho_ten?: string;
      so_dien_thoai?: string;
      email?: string;
    };
    AoNuoi?: {
      ten_ao?: string;
    };
    VuNuoi?: {
      ten_vu_nuoi?: string;
    };
  };
};

const statusLabels: Record<ProposalStatus, string> = {
  cho_duyet: "Chờ Admin duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
};

const formatMoney = (value?: number | string | null) =>
  Number(value || 0).toLocaleString("vi-VN") + " đ";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function StaffLimitProposalPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProposalStatus | "tat_ca">("tat_ca");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/phieu-de-xuat-han-muc");
      setProposals(res.data.data || []);
    } catch (error: any) {
      setAlert(
        error?.response?.data?.message || "Không thể tải danh sách phiếu đề xuất"
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
      const keyword = search.trim().toLowerCase();
      const customerName =
        item.HoSoKhachHang?.NguoiDung?.ho_ten?.toLowerCase() || "";
      const phone =
        item.HoSoKhachHang?.NguoiDung?.so_dien_thoai?.toLowerCase() || "";
      const profileId = String(item.id_ho_so || "");
      const proposalId = String(item.id_phieu_de_xuat || "");

      const matchSearch =
        !keyword ||
        customerName.includes(keyword) ||
        phone.includes(keyword) ||
        profileId.includes(keyword) ||
        proposalId.includes(keyword);

      const matchStatus =
        statusFilter === "tat_ca" || item.trang_thai === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [proposals, search, statusFilter]);

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

  return (
    <div className="staff-proposal-page">
      <div className="staff-assessment-header">
        <div>
          <p>Nhân viên định mức</p>
          <h1>Phiếu đề xuất hạn mức</h1>
          <span>Theo dõi các phiếu đề xuất đã gửi Admin duyệt.</span>
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
          <span>Tổng phiếu</span>
          <strong>{stats.total}</strong>
          <p>Tất cả phiếu đề xuất</p>
        </div>
        <div className="staff-assessment-stat-card">
          <span>Chờ duyệt</span>
          <strong>{stats.pending}</strong>
          <p>Đang chờ Admin xử lý</p>
        </div>
        <div className="staff-assessment-stat-card">
          <span>Đã duyệt</span>
          <strong>{stats.approved}</strong>
          <p>Đã được mở hạn mức</p>
        </div>
        <div className="staff-assessment-stat-card">
          <span>Từ chối</span>
          <strong>{stats.rejected}</strong>
          <p>Không đủ điều kiện</p>
        </div>
      </div>

      <div className="staff-assessment-card">
        <div className="staff-assessment-card__top">
          <div>
            <h2>Danh sách phiếu đề xuất</h2>
            <p>Tra cứu theo mã phiếu, mã hồ sơ hoặc khách hàng.</p>
          </div>
        </div>

        <div className="staff-assessment-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã phiếu, mã hồ sơ, khách hàng..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ProposalStatus | "tat_ca")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="cho_duyet">Chờ Admin duyệt</option>
            <option value="da_duyet">Đã duyệt</option>
            <option value="tu_choi">Từ chối</option>
          </select>
        </div>

        <div className="staff-assessment-table-wrap">
          <table className="staff-assessment-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Hồ sơ</th>
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
                    <div className="staff-assessment-empty">
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="staff-assessment-empty">
                      Không có phiếu đề xuất phù hợp
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal.id_phieu_de_xuat}>
                    <td>
                      <strong>PX #{proposal.id_phieu_de_xuat}</strong>
                    </td>
                    <td>
                      <strong>
                        {proposal.HoSoKhachHang?.NguoiDung?.ho_ten || "—"}
                      </strong>
                      <span>
                        {proposal.HoSoKhachHang?.NguoiDung?.so_dien_thoai ||
                          "Chưa có SĐT"}
                      </span>
                    </td>
                    <td>
                      <strong>HS #{proposal.id_ho_so}</strong>
                      <span>
                        {proposal.HoSoKhachHang?.AoNuoi?.ten_ao || "Ao nuôi"}
                      </span>
                    </td>
                    <td>{formatMoney(proposal.han_muc_hien_tai)}</td>
                    <td>{formatMoney(proposal.han_muc_de_xuat)}</td>
                    <td>{formatDate(proposal.ngay_de_xuat)}</td>
                    <td>
                      <span className={`staff-badge proposal-${proposal.trang_thai}`}>
                        {statusLabels[proposal.trang_thai]}
                      </span>
                    </td>
                    <td>
                      <div className="staff-assessment-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedProposal(proposal)}
                        >
                          Chi tiết
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

      {selectedProposal && (
        <div className="staff-modal-overlay">
          <div className="staff-modal">
            <div className="staff-modal__header">
              <div>
                <h2>Chi tiết phiếu #{selectedProposal.id_phieu_de_xuat}</h2>
                <p>Thông tin hạn mức đề xuất và kết quả xử lý.</p>
              </div>
              <button type="button" onClick={() => setSelectedProposal(null)}>
                ×
              </button>
            </div>

            <div className="staff-info-grid">
              <div>
                <span>Hồ sơ</span>
                <strong>HS #{selectedProposal.id_ho_so}</strong>
              </div>
              <div>
                <span>Khách hàng</span>
                <strong>
                  {selectedProposal.HoSoKhachHang?.NguoiDung?.ho_ten || "—"}
                </strong>
              </div>
              <div>
                <span>Hạn mức hiện tại</span>
                <strong>{formatMoney(selectedProposal.han_muc_hien_tai)}</strong>
              </div>
              <div>
                <span>Hạn mức đề xuất</span>
                <strong>{formatMoney(selectedProposal.han_muc_de_xuat)}</strong>
              </div>
              <div>
                <span>Hạn mức được duyệt</span>
                <strong>
                  {selectedProposal.han_muc_duoc_duyet
                    ? formatMoney(selectedProposal.han_muc_duoc_duyet)
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>{statusLabels[selectedProposal.trang_thai]}</strong>
              </div>
              <div className="staff-info-grid__full">
                <span>Lý do đề xuất</span>
                <strong>{selectedProposal.ly_do_de_xuat}</strong>
              </div>
              <div className="staff-info-grid__full">
                <span>Nhận xét khảo sát</span>
                <strong>{selectedProposal.nhan_xet_khao_sat || "—"}</strong>
              </div>
              {selectedProposal.ly_do_tu_choi && (
                <div className="staff-info-grid__full danger">
                  <span>Lý do từ chối</span>
                  <strong>{selectedProposal.ly_do_tu_choi}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}