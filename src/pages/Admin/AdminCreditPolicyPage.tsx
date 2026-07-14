import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  creditPolicyService,
  type CreditPolicy,
} from "../../services/creditPolicy.service";
import "./AdminCommon.css";
import "./AdminCreditPolicyPage.css";

const initialForm: CreditPolicy = {
  ten_chinh_sach: "",
  giai_doan: "giai_doan_1",
  tu_ngay: 0,
  den_ngay: 0,
  han_muc_toi_da: 0,
  ghi_chu: "",
  trang_thai: "hoat_dong",
};

const stageLabel: Record<string, string> = {
  giai_doan_1: "Giai đoạn 1",
  giai_doan_2: "Giai đoạn 2",
  giai_doan_3: "Giai đoạn 3",
  giai_doan_4: "Giai đoạn 4",
};

const statusLabel: Record<string, string> = {
  hoat_dong: "Đang áp dụng",
  tam_dung: "Tạm dừng",
};

const stageOrder: CreditPolicy["giai_doan"][] = [
  "giai_doan_1",
  "giai_doan_2",
  "giai_doan_3",
  "giai_doan_4",
];

const formatCurrency = (value?: number | string) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export default function AdminCreditPolicyPage() {
  const [policies, setPolicies] = useState<CreditPolicy[]>([]);
  const [form, setForm] = useState<CreditPolicy>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [keyword, setKeyword] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await creditPolicyService.getAllPolicies();
      setPolicies(Array.isArray(data) ? data : data?.data || []);
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          "Không tải được danh sách chính sách hạn mức"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const filteredPolicies = useMemo(() => {
    return policies.filter((item) => {
      const searchText = `${item.ten_chinh_sach} ${item.giai_doan} ${
        item.ghi_chu || ""
      }`.toLowerCase();

      const matchKeyword = searchText.includes(keyword.toLowerCase().trim());
      const matchStage = stageFilter === "all" || item.giai_doan === stageFilter;
      const matchStatus =
        statusFilter === "all" || item.trang_thai === statusFilter;

      return matchKeyword && matchStage && matchStatus;
    });
  }, [policies, keyword, stageFilter, statusFilter]);

  const groupedPolicies = useMemo(() => {
    const groups = new Map<string, CreditPolicy[]>();

    filteredPolicies.forEach((policy) => {
      const groupName = policy.ten_chinh_sach.trim();
      const current = groups.get(groupName) || [];
      current.push(policy);
      groups.set(groupName, current);
    });

    return Array.from(groups.entries()).map(([name, stages]) => {
      const sortedStages = stages.sort((a, b) => Number(a.tu_ngay) - Number(b.tu_ngay));
      const activeCount = sortedStages.filter((item) => item.trang_thai === "hoat_dong").length;
      const maxLimit = sortedStages.reduce((max, item) => {
        return Math.max(max, Number(item.han_muc_toi_da || 0));
      }, 0);

      return {
        name,
        stages: sortedStages,
        activeCount,
        maxLimit,
        dayRange:
          sortedStages.length > 0
            ? `${sortedStages[0].tu_ngay} - ${
                sortedStages[sortedStages.length - 1].den_ngay
              } ngày`
            : "Chưa có",
      };
    });
  }, [filteredPolicies]);

  const policySetNames = useMemo(() => {
    return Array.from(
      new Set(policies.map((item) => item.ten_chinh_sach.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "vi"));
  }, [policies]);

  const stats = useMemo(() => {
    const active = policies.filter(
      (item) => item.trang_thai === "hoat_dong"
    ).length;

    const paused = policies.filter(
      (item) => item.trang_thai === "tam_dung"
    ).length;

    const maxLimit = policies.reduce((max, item) => {
      return Math.max(max, Number(item.han_muc_toi_da || 0));
    }, 0);

    return {
      total: new Set(policies.map((item) => item.ten_chinh_sach.trim())).size,
      active,
      paused,
      maxLimit,
    };
  }, [policies]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(false);
  };

  const openCreateModal = (policyName = "") => {
    const existingStages = policies
      .filter((item) => item.ten_chinh_sach.trim() === policyName.trim())
      .map((item) => item.giai_doan);
    const nextStage =
      stageOrder.find((stage) => !existingStages.includes(stage)) ||
      initialForm.giai_doan;

    setForm({
      ...initialForm,
      ten_chinh_sach: policyName,
      giai_doan: nextStage,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (policy: CreditPolicy) => {
    setForm({
      ten_chinh_sach: policy.ten_chinh_sach || "",
      giai_doan: policy.giai_doan || "giai_doan_1",
      tu_ngay: policy.tu_ngay || 0,
      den_ngay: policy.den_ngay || 0,
      han_muc_toi_da: Number(policy.han_muc_toi_da || 0),
      ghi_chu: policy.ghi_chu || "",
      trang_thai: policy.trang_thai || "hoat_dong",
    });

    setEditingId(policy.id_chinh_sach || null);
    setShowModal(true);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "tu_ngay" ||
        name === "den_ngay" ||
        name === "han_muc_toi_da"
          ? Number(value)
          : value,
    }));
  };

  const validateForm = () => {
    if (!form.ten_chinh_sach.trim()) {
      setMessage("Vui lòng nhập tên bộ chính sách");
      return false;
    }

    if (!form.giai_doan) {
      setMessage("Vui lòng chọn giai đoạn");
      return false;
    }

    if (Number(form.tu_ngay) < 0 || Number(form.den_ngay) < 0) {
      setMessage("Số ngày nuôi không được nhỏ hơn 0");
      return false;
    }

    if (Number(form.den_ngay) < Number(form.tu_ngay)) {
      setMessage("Đến ngày phải lớn hơn hoặc bằng từ ngày");
      return false;
    }

    if (Number(form.han_muc_toi_da) <= 0) {
      setMessage("Hạn mức tối đa phải lớn hơn 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (editingId) {
        await creditPolicyService.updatePolicy(editingId, form);
        setMessage("Cập nhật giai đoạn hạn mức thành công");
      } else {
        await creditPolicyService.createPolicy(form);
        setMessage("Thêm giai đoạn hạn mức thành công");
      }

      resetForm();
      fetchPolicies();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Lưu chính sách thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (policy: CreditPolicy) => {
    if (!policy.id_chinh_sach) {
      setMessage("Không tìm thấy mã chính sách");
      return;
    }

    try {
      setLoading(true);
      await creditPolicyService.togglePolicyStatus(policy.id_chinh_sach);
      setMessage("Cập nhật trạng thái thành công");
      fetchPolicies();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page credit-policy-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Hạn mức</p>
          <h1>Quản lý chính sách hạn mức</h1>
          <p>Thiết lập một bộ chính sách gồm nhiều giai đoạn tăng hạn mức theo ngày nuôi.</p>
        </div>

        <button className="admin-primary-btn" onClick={() => openCreateModal()}>
          + Thêm giai đoạn
        </button>
      </div>

      {message && (
        <div className="admin-alert credit-policy-alert">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <div className="credit-policy-stats">
        <div className="credit-policy-stat-card">
          <span>Tổng chính sách</span>
          <strong>{stats.total}</strong>
          <p>Bộ chính sách đang có</p>
        </div>

        <div className="credit-policy-stat-card">
          <span>Đang áp dụng</span>
          <strong>{stats.active}</strong>
          <p>Có thể dùng để xét hạn mức</p>
        </div>

        <div className="credit-policy-stat-card">
          <span>Tạm dừng</span>
          <strong>{stats.paused}</strong>
          <p>Không dùng trong xét duyệt</p>
        </div>

        <div className="credit-policy-stat-card">
          <span>Hạn mức cao nhất</span>
          <strong>{formatCurrency(stats.maxLimit)}</strong>
          <p>Theo chính sách hiện tại</p>
        </div>
      </div>

      <div className="admin-card credit-policy-card">
        <div className="credit-policy-card__top">
          <div>
            <h2>Danh sách bộ chính sách</h2>
            <p>Mỗi tên chính sách có thể chứa nhiều giai đoạn hạn mức theo ngày nuôi.</p>
          </div>
        </div>

        <div className="admin-toolbar credit-policy-toolbar">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên chính sách, ghi chú..."
          />

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            <option value="all">Tất cả giai đoạn</option>
            <option value="giai_doan_1">Giai đoạn 1</option>
            <option value="giai_doan_2">Giai đoạn 2</option>
            <option value="giai_doan_3">Giai đoạn 3</option>
            <option value="giai_doan_4">Giai đoạn 4</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="hoat_dong">Đang áp dụng</option>
            <option value="tam_dung">Tạm dừng</option>
          </select>
        </div>

        <div className="credit-policy-set-list">
          {loading ? (
            <div className="credit-policy-empty">Đang tải dữ liệu...</div>
          ) : groupedPolicies.length === 0 ? (
            <div className="credit-policy-empty">
              <strong>Chưa có chính sách phù hợp</strong>
              <span>Hãy thêm giai đoạn hoặc thay đổi bộ lọc.</span>
            </div>
          ) : (
            groupedPolicies.map((group) => (
              <article className="credit-policy-set-card" key={group.name}>
                <div className="credit-policy-set-card__head">
                  <div>
                    <span>Bộ chính sách</span>
                    <h3>{group.name}</h3>
                  </div>

                  <button
                    type="button"
                    className="credit-policy-set-card__add"
                    onClick={() => openCreateModal(group.name)}
                  >
                    + Thêm giai đoạn
                  </button>
                </div>

                <div className="credit-policy-set-card__meta">
                  <div>
                    <span>Số giai đoạn</span>
                    <strong>{group.stages.length}</strong>
                  </div>
                  <div>
                    <span>Đang áp dụng</span>
                    <strong>{group.activeCount}</strong>
                  </div>
                  <div>
                    <span>Khoảng ngày nuôi</span>
                    <strong>{group.dayRange}</strong>
                  </div>
                  <div>
                    <span>Hạn mức cao nhất</span>
                    <strong>{formatCurrency(group.maxLimit)}</strong>
                  </div>
                </div>

                <div className="credit-policy-stage-flow">
                  {group.stages.map((item, index) => (
                    <section
                      className={`credit-policy-stage-card ${item.trang_thai}`}
                      key={item.id_chinh_sach}
                    >
                      <div className="credit-policy-stage-card__marker">
                        {index + 1}
                      </div>

                      <div className="credit-policy-stage-card__body">
                        <div className="credit-policy-stage-card__top">
                          <span className={`credit-policy-stage ${item.giai_doan}`}>
                            {stageLabel[item.giai_doan] || item.giai_doan}
                          </span>
                          <span className={`admin-badge ${item.trang_thai}`}>
                            {statusLabel[item.trang_thai || ""] || "Chưa rõ"}
                          </span>
                        </div>

                        <div className="credit-policy-stage-card__grid">
                          <div>
                            <small>Ngày nuôi</small>
                            <strong>
                              {item.tu_ngay} - {item.den_ngay} ngày
                            </strong>
                          </div>
                          <div>
                            <small>Hạn mức tối đa</small>
                            <strong>{formatCurrency(item.han_muc_toi_da)}</strong>
                          </div>
                        </div>

                        <p>{item.ghi_chu || "Chưa có ghi chú cho giai đoạn này."}</p>

                        <div className="credit-policy-actions">
                          <button type="button" onClick={() => openEditModal(item)}>
                            Sửa
                          </button>

                          <button type="button" onClick={() => handleToggleStatus(item)}>
                            {item.trang_thai === "hoat_dong"
                              ? "Tạm dừng"
                              : "Áp dụng"}
                          </button>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="admin-table-wrap credit-policy-legacy-table">
          <table className="admin-table credit-policy-table">
            <thead>
              <tr>
                <th>Chính sách</th>
                <th>Giai đoạn</th>
                <th>Khoảng ngày nuôi</th>
                <th>Hạn mức tối đa</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="credit-policy-empty">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : groupedPolicies.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="credit-policy-empty">
                      <strong>Chưa có chính sách phù hợp</strong>
                      <span>Hãy thêm giai đoạn hoặc thay đổi bộ lọc.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedPolicies.flatMap((group) => [
                  <tr className="credit-policy-group-row" key={`group-${group.name}`}>
                    <td colSpan={6}>
                      <strong>{group.name}</strong>
                      <span>{group.stages.length} giai đoạn hạn mức</span>
                    </td>
                  </tr>,
                  ...group.stages.map((item) => (
                    <tr key={item.id_chinh_sach}>
                      <td>
                        <strong>Giai đoạn trong bộ chính sách</strong>
                        <span>{item.ghi_chu || "Chưa có ghi chú"}</span>
                      </td>

                      <td>
                        <span className={`credit-policy-stage ${item.giai_doan}`}>
                          {stageLabel[item.giai_doan] || item.giai_doan}
                        </span>
                      </td>

                      <td>
                        {item.tu_ngay} - {item.den_ngay} ngày
                      </td>

                      <td>
                        <strong>{formatCurrency(item.han_muc_toi_da)}</strong>
                      </td>

                      <td>
                        <span className={`admin-badge ${item.trang_thai}`}>
                          {statusLabel[item.trang_thai || ""] || "Chưa rõ"}
                        </span>
                      </td>

                      <td>
                        <div className="credit-policy-actions">
                          <button onClick={() => openEditModal(item)}>Sửa</button>

                          <button onClick={() => handleToggleStatus(item)}>
                            {item.trang_thai === "hoat_dong"
                              ? "Tạm dừng"
                              : "Áp dụng"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )),
                ])
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal credit-policy-modal">
            <div className="admin-modal__header">
              <div>
                <h2>
                  {editingId
                    ? "Cập nhật giai đoạn hạn mức"
                    : "Thêm giai đoạn hạn mức"}
                </h2>
                <p>Dùng cùng tên bộ chính sách để gom các giai đoạn 1, 2, 3, 4 vào chung một nhóm.</p>
              </div>

              <button className="admin-modal__close" onClick={resetForm}>
                ×
              </button>
            </div>

            <form className="credit-policy-form" onSubmit={handleSubmit}>
              <div className="credit-policy-form-grid">
                {!editingId && policySetNames.length > 0 && (
                  <label className="credit-policy-form-grid__full">
                    Chọn bộ chính sách có sẵn
                    <select
                      value={
                        policySetNames.includes(form.ten_chinh_sach.trim())
                          ? form.ten_chinh_sach
                          : ""
                      }
                      onChange={(event) => {
                        const policyName = event.target.value;

                        if (!policyName) {
                          setForm((prev) => ({
                            ...prev,
                            ten_chinh_sach: "",
                            giai_doan: initialForm.giai_doan,
                          }));
                          return;
                        }

                        const existingStages = policies
                          .filter(
                            (item) =>
                              item.ten_chinh_sach.trim() === policyName.trim()
                          )
                          .map((item) => item.giai_doan);
                        const nextStage =
                          stageOrder.find(
                            (stage) => !existingStages.includes(stage)
                          ) || initialForm.giai_doan;

                        setForm((prev) => ({
                          ...prev,
                          ten_chinh_sach: policyName,
                          giai_doan: nextStage,
                        }));
                      }}
                    >
                      <option value="">Tạo bộ chính sách mới</option>
                      {policySetNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Tên bộ chính sách
                  <input
                    name="ten_chinh_sach"
                    value={form.ten_chinh_sach}
                    onChange={handleChange}
                    placeholder="VD: Chính sách nuôi tôm 2026"
                  />
                </label>

                <label>
                  Giai đoạn
                  <select
                    name="giai_doan"
                    value={form.giai_doan}
                    onChange={handleChange}
                  >
                    <option value="giai_doan_1">Giai đoạn 1</option>
                    <option value="giai_doan_2">Giai đoạn 2</option>
                    <option value="giai_doan_3">Giai đoạn 3</option>
                    <option value="giai_doan_4">Giai đoạn 4</option>
                  </select>
                </label>

                <label>
                  Từ ngày nuôi
                  <input
                    type="number"
                    name="tu_ngay"
                    value={form.tu_ngay}
                    onChange={handleChange}
                    min={0}
                  />
                </label>

                <label>
                  Đến ngày nuôi
                  <input
                    type="number"
                    name="den_ngay"
                    value={form.den_ngay}
                    onChange={handleChange}
                    min={0}
                  />
                </label>

                <label>
                  Hạn mức tối đa
                  <input
                    type="number"
                    name="han_muc_toi_da"
                    value={form.han_muc_toi_da}
                    onChange={handleChange}
                    min={0}
                  />
                </label>

                <label>
                  Trạng thái
                  <select
                    name="trang_thai"
                    value={form.trang_thai}
                    onChange={handleChange}
                  >
                    <option value="hoat_dong">Đang áp dụng</option>
                    <option value="tam_dung">Tạm dừng</option>
                  </select>
                </label>

                <label className="credit-policy-form-grid__full">
                  Ghi chú
                  <textarea
                    name="ghi_chu"
                    value={form.ghi_chu || ""}
                    onChange={handleChange}
                    placeholder="Nhập ghi chú, điều kiện áp dụng hoặc lưu ý cho Admin..."
                  />
                </label>
              </div>

              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={resetForm}
                >
                  Hủy
                </button>

                <button type="submit" className="admin-primary-btn" disabled={saving}>
                  {saving ? "Đang lưu..." : editingId ? "Lưu cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
