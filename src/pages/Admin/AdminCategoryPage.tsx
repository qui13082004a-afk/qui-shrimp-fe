import { useEffect, useMemo, useState } from "react";
import {
  categoryService,
  type Category,
  type CategoryPayload,
  type CategoryStatus,
} from "../../services/category.service";
import { confirmDialog } from "../../utils/notify";
import "./AdminCommon.css";
import "./AdminSalesPages.css";

const statusLabels: Record<CategoryStatus, string> = {
  hoat_dong: "Hoạt động",
  an: "Ẩn",
};

const emptyForm: CategoryPayload = {
  ten_danh_muc: "",
  mo_ta: "",
  trang_thai: "hoat_dong",
};

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | "tat_ca">(
    "tat_ca"
  );
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryPayload>(emptyForm);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAdminCategories();
      setCategories(res.data || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchSearch =
        !keyword ||
        category.ten_danh_muc.toLowerCase().includes(keyword) ||
        String(category.id_danh_muc).includes(keyword);
      const matchStatus =
        statusFilter === "tat_ca" || category.trang_thai === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [categories, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((item) => item.trang_thai === "hoat_dong")
        .length,
      hidden: categories.filter((item) => item.trang_thai === "an").length,
      shown: filteredCategories.length,
    }),
    [categories, filteredCategories.length]
  );

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      ten_danh_muc: category.ten_danh_muc,
      mo_ta: category.mo_ta || "",
      trang_thai: category.trang_thai,
    });
    setShowModal(true);
  };

  const submitForm = async () => {
    if (!form.ten_danh_muc.trim()) {
      setAlert("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id_danh_muc, form);
        setAlert("Cập nhật danh mục thành công.");
      } else {
        await categoryService.createCategory(form);
        setAlert("Thêm danh mục thành công.");
      }

      setShowModal(false);
      await loadCategories();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể lưu danh mục.");
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      await categoryService.updateCategory(category.id_danh_muc, {
        trang_thai: category.trang_thai === "hoat_dong" ? "an" : "hoat_dong",
      });
      await loadCategories();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể cập nhật trạng thái.");
    }
  };

  const deleteCategory = async (category: Category) => {
    const confirmed = await confirmDialog(
      `Xóa danh mục "${category.ten_danh_muc}"?`
    );
    if (!confirmed) return;

    try {
      await categoryService.deleteCategory(category.id_danh_muc);
      setAlert("Xóa danh mục thành công.");
      await loadCategories();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể xóa danh mục.");
    }
  };

  return (
    <div className="admin-page admin-sales-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Quản lý bán hàng</p>
          <h1>Danh mục sản phẩm</h1>
          <p>Quản lý nhóm vật tư hiển thị ở cửa hàng và form tạo sản phẩm.</p>
        </div>
        <button className="admin-primary-btn" type="button" onClick={openCreate}>
          + Thêm danh mục
        </button>
      </div>

      {alert && <div className="admin-alert">{alert}</div>}

      <div className="admin-sales-stats">
        <div className="admin-sales-card">
          <span>Tổng danh mục</span>
          <strong>{stats.total}</strong>
          <p>Toàn bộ danh mục</p>
        </div>
        <div className="admin-sales-card">
          <span>Đang hoạt động</span>
          <strong>{stats.active}</strong>
          <p>Hiển thị cho khách hàng</p>
        </div>
        <div className="admin-sales-card">
          <span>Đã ẩn</span>
          <strong>{stats.hidden}</strong>
          <p>Không hiển thị công khai</p>
        </div>
        <div className="admin-sales-card">
          <span>Kết quả lọc</span>
          <strong>{stats.shown}</strong>
          <p>Theo bộ lọc hiện tại</p>
        </div>
      </div>

      <div className="admin-card admin-sales-list-card">
        <div className="admin-sales-card__top">
          <div>
            <h2>Danh sách danh mục</h2>
            <p>Tìm kiếm, cập nhật hoặc ẩn danh mục không còn sử dụng.</p>
          </div>
        </div>

        <div className="admin-sales-toolbar two-cols">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên hoặc mã danh mục..."
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as CategoryStatus | "tat_ca")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="hoat_dong">Hoạt động</option>
            <option value="an">Ẩn</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                    <td colSpan={4}>
                      <div className="admin-empty">Đang tải dữ liệu...</div>
                    </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                    <td colSpan={4}>
                      <div className="admin-empty">Không có danh mục phù hợp</div>
                    </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id_danh_muc}>
                    <td>#{category.id_danh_muc}</td>
                    <td>
                      <strong>{category.ten_danh_muc}</strong>
                      <span>{category.mo_ta || "Chưa có mô tả"}</span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          category.trang_thai === "hoat_dong" ? "green" : "gray"
                        }`}
                      >
                        {statusLabels[category.trang_thai]}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" onClick={() => openEdit(category)}>
                          Sửa
                        </button>
                        <button type="button" onClick={() => toggleStatus(category)}>
                          {category.trang_thai === "hoat_dong" ? "Ẩn" : "Bật"}
                        </button>
                        <button type="button" onClick={() => deleteCategory(category)}>
                          Xóa
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

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <div>
                <h2>{editingCategory ? "Cập nhật danh mục" : "Thêm danh mục"}</h2>
                <p>Thông tin danh mục dùng để phân nhóm sản phẩm trong cửa hàng.</p>
              </div>
              <button
                className="admin-modal__close"
                type="button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-sales-form">
              <label>
                Tên danh mục *
                <input
                  value={form.ten_danh_muc}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ten_danh_muc: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Trạng thái
                <select
                  value={form.trang_thai || "hoat_dong"}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      trang_thai: event.target.value as CategoryStatus,
                    }))
                  }
                >
                  <option value="hoat_dong">Hoạt động</option>
                  <option value="an">Ẩn</option>
                </select>
              </label>
              <label className="full">
                Mô tả
                <textarea
                  value={form.mo_ta || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      mo_ta: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-secondary-btn"
                type="button"
                onClick={() => setShowModal(false)}
              >
                Hủy
              </button>
              <button className="admin-primary-btn" type="button" onClick={submitForm}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
