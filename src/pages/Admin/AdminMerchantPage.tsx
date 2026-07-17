import { useEffect, useMemo, useState } from "react";
import { merchantService } from "../../services/merchant.service";
import type { Merchant } from "../../services/merchant.service";
import { confirmDialog } from "../../utils/notify";
import "./AdminCommon.css";
import "./AdminMerchantPage.css";

const initialForm: Partial<Merchant> = {
  ten_thuong_lai: "",
  so_dien_thoai: "",
  dia_chi: "",
  ma_so_thue: "",
  trang_thai: "hoat_dong",
  ghi_chu: "",
};

const statusLabel: Record<string, string> = {
  hoat_dong: "Hoạt động",
  tam_khoa: "Tạm khóa",
  ngung_hop_tac: "Ngừng hợp tác",
};

export default function AdminMerchantPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<Partial<Merchant>>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await merchantService.getAllMerchants();
      setMerchants(res.data || res || []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Không tải được danh sách thương lái");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((item) => {
      const text = `${item.ten_thuong_lai || ""} ${item.so_dien_thoai || ""} ${
        item.dia_chi || ""
      }`.toLowerCase();

      return (
        text.includes(keyword.toLowerCase()) &&
        (status === "all" || item.trang_thai === status)
      );
    });
  }, [merchants, keyword, status]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.ten_thuong_lai?.trim()) {
      setMessage("Vui lòng nhập tên thương lái");
      return;
    }

    if (!form.so_dien_thoai?.trim()) {
      setMessage("Vui lòng nhập số điện thoại");
      return;
    }

    try {
      setLoading(true);

      if (editingId) {
        await merchantService.updateMerchant(editingId, form);
        setMessage("Cập nhật thương lái thành công");
      } else {
        await merchantService.createMerchant(form);
        setMessage("Thêm thương lái thành công");
      }

      resetForm();
      fetchMerchants();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (merchant: Merchant) => {
    setEditingId(merchant.id_thuong_lai);
    setForm({
      ten_thuong_lai: merchant.ten_thuong_lai,
      so_dien_thoai: merchant.so_dien_thoai,
      dia_chi: merchant.dia_chi || "",
      ma_so_thue: merchant.ma_so_thue || "",
      trang_thai: merchant.trang_thai,
      ghi_chu: merchant.ghi_chu || "",
    });
    setShowForm(true);
  };

  const handleStatus = async (id: number, trang_thai: Merchant["trang_thai"]) => {
    try {
      await merchantService.updateMerchantStatus(id, { trang_thai });
      setMessage("Cập nhật trạng thái thành công");
      fetchMerchants();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Không cập nhật được trạng thái");
    }
  };

  const handleViolation = async (id: number) => {
    const ok = await confirmDialog("Ghi nhận 1 lần vi phạm cho thương lái này?");
    if (!ok) return;

    try {
      await merchantService.increaseViolation(id);
      setMessage("Đã ghi nhận vi phạm");
      fetchMerchants();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Không ghi nhận được vi phạm");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Thương lái</p>
          <h1>Quản lý thương lái</h1>
          <p>Quản lý thông tin, trạng thái hợp tác và lịch sử vi phạm.</p>
        </div>

        <button className="admin-primary-btn" onClick={openCreateForm}>
          + Thêm thương lái
        </button>
      </div>

      {message && <div className="admin-alert">{message}</div>}

      <div className="admin-card">
        <div className="admin-toolbar">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, SĐT, địa chỉ..."
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="hoat_dong">Hoạt động</option>
            <option value="tam_khoa">Tạm khóa</option>
            <option value="ngung_hop_tac">Ngừng hợp tác</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thương lái</th>
                <th>Liên hệ</th>
                <th>Tham gia</th>
                <th>Vi phạm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Đang tải dữ liệu...</td>
                </tr>
              ) : filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={6}>Chưa có thương lái phù hợp</td>
                </tr>
              ) : (
                filteredMerchants.map((item) => (
                  <tr key={item.id_thuong_lai}>
                    <td>
                      <strong>{item.ten_thuong_lai}</strong>
                      <span>{item.ma_so_thue || "Chưa có MST"}</span>
                    </td>

                    <td>
                      <strong>{item.so_dien_thoai}</strong>
                      <span>{item.dia_chi || "Chưa cập nhật địa chỉ"}</span>
                    </td>

                    <td>{item.so_lan_tham_gia || 0}</td>
                    <td>{item.so_lan_vi_pham || 0}</td>

                    <td>
                      <span className={`admin-badge ${item.trang_thai}`}>
                        {statusLabel[item.trang_thai] || item.trang_thai}
                      </span>
                    </td>

                    <td>
                      <div className="merchant-actions">
                        <button onClick={() => handleEdit(item)}>Sửa</button>

                        <button
                          onClick={() =>
                            handleStatus(
                              item.id_thuong_lai,
                              item.trang_thai === "hoat_dong"
                                ? "ngung_hop_tac"
                                : "hoat_dong"
                            )
                          }
                        >
                          {item.trang_thai === "hoat_dong" ? "Ngừng" : "Mở"}
                        </button>

                        <button
                          className="danger"
                          onClick={() => handleViolation(item.id_thuong_lai)}
                        >
                          Vi phạm
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

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <div>
                <h2>{editingId ? "Cập nhật thương lái" : "Thêm thương lái"}</h2>
                <p>Nhập thông tin thương lái tham gia thỏa thuận ba bên.</p>
              </div>

              <button className="admin-modal__close" onClick={resetForm}>
                ×
              </button>
            </div>

            <form className="merchant-modal-form" onSubmit={handleSubmit}>
              <div className="merchant-modal-grid">
                <label>
                  Tên thương lái
                  <input
                    name="ten_thuong_lai"
                    value={form.ten_thuong_lai || ""}
                    onChange={handleChange}
                    placeholder="Nhập tên thương lái"
                  />
                </label>

                <label>
                  Số điện thoại
                  <input
                    name="so_dien_thoai"
                    value={form.so_dien_thoai || ""}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </label>

                <label>
                  Địa chỉ
                  <input
                    name="dia_chi"
                    value={form.dia_chi || ""}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                  />
                </label>

                <label>
                  Mã số thuế
                  <input
                    name="ma_so_thue"
                    value={form.ma_so_thue || ""}
                    onChange={handleChange}
                    placeholder="Có thể bỏ trống"
                  />
                </label>

                <label>
                  Trạng thái
                  <select
                    name="trang_thai"
                    value={form.trang_thai || "hoat_dong"}
                    onChange={handleChange}
                  >
                    <option value="hoat_dong">Hoạt động</option>
                    <option value="tam_khoa">Tạm khóa</option>
                    <option value="ngung_hop_tac">Ngừng hợp tác</option>
                  </select>
                </label>

                <label className="merchant-modal-grid__full">
                  Ghi chú
                  <textarea
                    name="ghi_chu"
                    value={form.ghi_chu || ""}
                    onChange={handleChange}
                    placeholder="Ghi chú thêm"
                  />
                </label>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-secondary-btn" onClick={resetForm}>
                  Hủy
                </button>

                <button type="submit" className="admin-primary-btn" disabled={loading}>
                  {editingId ? "Lưu cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
