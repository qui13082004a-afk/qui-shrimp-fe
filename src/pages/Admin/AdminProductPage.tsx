import { useEffect, useMemo, useState } from "react";
import {
  productService,
  type Product,
  type ProductPayload,
  type ProductStatus,
} from "../../services/product.service";
import { categoryService, type Category } from "../../services/category.service";
import {
  warehouseService,
  type Warehouse,
} from "../../services/warehouse.service";
import {
  departurePointService,
  type DeparturePoint,
} from "../../services/departurePoint.service";
import { confirmDialog } from "../../utils/notify";
import "./AdminCommon.css";
import "./AdminSalesPages.css";

const statusLabels: Record<ProductStatus, string> = {
  dang_ban: "Đang bán",
  ngung_ban: "Ngừng bán",
  het_hang: "Hết hàng",
};

const emptyForm: ProductPayload = {
  id_danh_muc: "",
  ten_san_pham: "",
  gia: "",
  don_vi_tinh: "",
  mo_ta: "",
  cong_dung: "",
  huong_dan_su_dung: "",
  han_su_dung: "",
  xuat_xu: "",
  trang_thai: "dang_ban",
  id_kho_hang: "",
  so_luong_kho: "",
  ton_kho_toi_thieu: "",
};

const formatMoney = (value?: number | string | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const parseImages = (value?: string | string[] | null) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

export default function AdminProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [departurePoints, setDeparturePoints] = useState<DeparturePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("tat_ca");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("tat_ca");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "tat_ca">(
    "tat_ca"
  );
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    id_kho_hang: "",
    so_luong: "",
    ton_kho_toi_thieu: "",
    ghi_chu: "",
  });
  const [warehouseForm, setWarehouseForm] = useState({
    ten_kho: "",
    id_diem_xuat_phat: "",
    ghi_chu: "",
    trang_thai: "hoat_dong" as "hoat_dong" | "tam_ngung",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const productParams = {
        page: 1,
        limit: 50,
        sortBy: "newest",
        keyword: search.trim() || undefined,
        id_danh_muc: categoryFilter === "tat_ca" ? undefined : categoryFilter,
        id_kho_hang: warehouseFilter === "tat_ca" ? undefined : warehouseFilter,
        trang_thai: statusFilter === "tat_ca" ? undefined : statusFilter,
      };
      const [productRes, categoryRes, warehouseRes, departurePointRes] = await Promise.all([
        productService.getAdminProducts(productParams),
        categoryService.getAdminCategories(),
        warehouseService.getWarehouses(),
        departurePointService.getDeparturePoints(),
      ]);
      setProducts(productRes.data || []);
      setCategories(categoryRes.data || []);
      setWarehouses(warehouseRes.data || []);
      setDeparturePoints(departurePointRes.data || []);
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, categoryFilter, warehouseFilter, statusFilter]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchSearch =
        !keyword ||
        product.ten_san_pham.toLowerCase().includes(keyword) ||
        String(product.id_san_pham).includes(keyword) ||
        String(product.xuat_xu || "").toLowerCase().includes(keyword);
      const matchCategory =
        categoryFilter === "tat_ca" ||
        String(product.id_danh_muc) === String(categoryFilter);
      const matchWarehouse =
        warehouseFilter === "tat_ca" ||
        (product.TonKhoSanPhams || []).some(
          (stock) => String(stock.id_kho_hang) === String(warehouseFilter)
        );
      const matchStatus =
        statusFilter === "tat_ca" || product.trang_thai === statusFilter;

      return matchSearch && matchCategory && matchWarehouse && matchStatus;
    });
  }, [products, search, categoryFilter, warehouseFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((item) => item.trang_thai === "dang_ban").length,
      lowStock: products.filter((item) =>
        (item.TonKhoSanPhams || []).some((stock) => {
          const minimumStock = Number(stock.ton_kho_toi_thieu || 0);
          return minimumStock > 0 && Number(stock.so_luong || 0) <= minimumStock;
        })
      ).length,
      hidden: products.filter((item) => item.trang_thai !== "dang_ban").length,
    }),
    [products]
  );

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      id_danh_muc: product.id_danh_muc,
      ten_san_pham: product.ten_san_pham,
      gia: product.gia,
      don_vi_tinh: product.don_vi_tinh || "",
      mo_ta: product.mo_ta || "",
      cong_dung: product.cong_dung || "",
      huong_dan_su_dung: product.huong_dan_su_dung || "",
      han_su_dung: product.han_su_dung || "",
      xuat_xu: product.xuat_xu || "",
      trang_thai: product.trang_thai,
      id_kho_hang: "",
      so_luong_kho: "",
      ton_kho_toi_thieu: "",
    });
    setShowModal(true);
  };

  const submitForm = async () => {
    if (!form.id_danh_muc || !form.ten_san_pham.trim()) {
      setAlert("Vui lòng chọn danh mục và nhập tên sản phẩm.");
      return;
    }

    try {
      let savedProductId = editingProduct?.id_san_pham;

      if (editingProduct) {
        const res = await productService.updateProduct(editingProduct.id_san_pham, form);
        savedProductId = res?.data?.id_san_pham || editingProduct.id_san_pham;
        setAlert("Cập nhật sản phẩm thành công.");
      } else {
        const res = await productService.createProduct(form);
        savedProductId = res?.data?.id_san_pham;
        setAlert("Thêm sản phẩm thành công.");
      }

      if (savedProductId && form.id_kho_hang && form.so_luong_kho !== "") {
        const productId = savedProductId as string | number;
        const warehouseId = await resolveWarehouseSelection(form.id_kho_hang);

        await warehouseService.upsertProductStock({
          id_san_pham: productId,
          id_kho_hang: warehouseId,
          so_luong: form.so_luong_kho as string | number,
          ton_kho_toi_thieu: form.ton_kho_toi_thieu || 0,
        });
      }

      setShowModal(false);
      await loadData();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể lưu sản phẩm.");
    }
  };

  const quickStatus = async (product: Product, status: ProductStatus) => {
    try {
      await productService.updateProduct(product.id_san_pham, {
        id_danh_muc: product.id_danh_muc,
        ten_san_pham: product.ten_san_pham,
        gia: product.gia,
        trang_thai: status,
      });
      await loadData();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể cập nhật sản phẩm.");
    }
  };

  const hideProduct = async (product: Product) => {
    const confirmed = await confirmDialog(`Ẩn sản phẩm "${product.ten_san_pham}"?`);
    if (!confirmed) return;

    try {
      await productService.deleteProduct(product.id_san_pham);
      setAlert("Đã ẩn sản phẩm.");
      await loadData();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể ẩn sản phẩm.");
    }
  };

  const openStockModal = (product: Product) => {
    setStockProduct(product);
    setStockForm({
      id_kho_hang: "",
      so_luong: "",
      ton_kho_toi_thieu: "",
      ghi_chu: "",
    });
  };

  const submitStock = async () => {
    if (!stockProduct || !stockForm.id_kho_hang || stockForm.so_luong === "") {
      setAlert("Vui lòng chọn kho và nhập số lượng tồn.");
      return;
    }

    try {
      const warehouseId = await resolveWarehouseSelection(stockForm.id_kho_hang);

      await warehouseService.upsertProductStock({
        id_san_pham: stockProduct.id_san_pham,
        id_kho_hang: warehouseId,
        so_luong: stockForm.so_luong,
        ton_kho_toi_thieu: stockForm.ton_kho_toi_thieu || 0,
        ghi_chu: stockForm.ghi_chu,
      });
      setAlert("Cập nhật tồn kho theo kho thành công.");
      setStockProduct(null);
      await loadData();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể cập nhật tồn kho.");
    }
  };

  const resolveWarehouseSelection = async (value: string | number) => {
    const rawValue = String(value);

    if (rawValue.startsWith("warehouse:")) {
      return rawValue.replace("warehouse:", "");
    }

    if (rawValue.startsWith("departure:")) {
      const departurePointId = rawValue.replace("departure:", "");
      const departurePoint = departurePoints.find(
        (point) => String(point.id_diem_xuat_phat) === departurePointId
      );

      const existedWarehouse = warehouses.find(
        (warehouse) =>
          String(warehouse.id_diem_xuat_phat) === departurePointId ||
          warehouse.dia_chi === departurePoint?.dia_chi
      );

      if (existedWarehouse) {
        return String(existedWarehouse.id_kho_hang);
      }

      const res = await warehouseService.createWarehouse({
        id_diem_xuat_phat: departurePointId,
        ten_kho: departurePoint?.ten_diem || "Kho hàng",
        trang_thai: "hoat_dong",
      });

      return String(res.data.id_kho_hang);
    }

    return rawValue;
  };

  const submitWarehouse = async () => {
    if (!warehouseForm.id_diem_xuat_phat) {
      setAlert("Vui lòng chọn địa chỉ kinh doanh cho kho.");
      return;
    }

    try {
      await warehouseService.createWarehouse(warehouseForm);
      setAlert("Tạo kho hàng thành công.");
      setShowWarehouseModal(false);
      setWarehouseForm({
        ten_kho: "",
        id_diem_xuat_phat: "",
        ghi_chu: "",
        trang_thai: "hoat_dong",
      });
      await loadData();
    } catch (error: any) {
      setAlert(error?.response?.data?.message || "Không thể tạo kho hàng.");
    }
  };

  const renderWarehouseStocks = (product: Product) => {
    const stocks = product.TonKhoSanPhams || [];
    if (!stocks.length) {
      return <span>Chưa phân kho</span>;
    }

    return (
      <div className="admin-stock-list">
        {stocks.map((stock) => {
          const minimumStock = Number(stock.ton_kho_toi_thieu || 0);
          const quantity = Number(stock.so_luong || 0);
          const isLowStock = minimumStock > 0 && quantity <= minimumStock;

          return (
            <div
              className={`admin-stock-list__item${isLowStock ? " is-low" : ""}`}
              key={stock.id_ton_kho || `${stock.id_kho_hang}-${stock.so_luong}`}
            >
              <strong>{stock.KhoHang?.ten_kho || `Kho #${stock.id_kho_hang}`}</strong>
              <span>
                {quantity.toLocaleString("vi-VN")}
                {minimumStock > 0 ? ` / tối thiểu ${minimumStock.toLocaleString("vi-VN")}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-page admin-sales-page">
      <div className="admin-page__header admin-page__header--between">
        <div>
          <p className="admin-page__eyebrow">Quản lý bán hàng</p>
          <h1>Sản phẩm</h1>
          <p>Quản lý vật tư, tồn kho, hình ảnh và trạng thái bán hàng.</p>
        </div>
        <div className="admin-actions">
          <button className="admin-secondary-btn" type="button" onClick={() => setShowWarehouseModal(true)}>
            + Thêm kho
          </button>
          <button className="admin-primary-btn" type="button" onClick={openCreate}>
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {alert && <div className="admin-alert">{alert}</div>}

      <div className="admin-sales-stats">
        <div className="admin-sales-card">
          <span>Tổng sản phẩm</span>
          <strong>{stats.total}</strong>
          <p>Toàn bộ sản phẩm</p>
        </div>
        <div className="admin-sales-card">
          <span>Đang bán</span>
          <strong>{stats.active}</strong>
          <p>Hiển thị ở cửa hàng</p>
        </div>
        <div className="admin-sales-card">
          <span>Tồn kho thấp</span>
          <strong>{stats.lowStock}</strong>
          <p>Bằng hoặc dưới tồn tối thiểu</p>
        </div>
        <div className="admin-sales-card">
          <span>Không bán</span>
          <strong>{stats.hidden}</strong>
          <p>Ngừng bán hoặc hết hàng</p>
        </div>
      </div>

      <div className="admin-card admin-sales-list-card">
        <div className="admin-sales-card__top">
          <div>
            <h2>Danh sách sản phẩm</h2>
            <p>Tìm kiếm, lọc danh mục và cập nhật nhanh trạng thái sản phẩm.</p>
          </div>
        </div>

        <div className="admin-sales-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên, mã sản phẩm hoặc xuất xứ..."
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="tat_ca">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id_danh_muc} value={category.id_danh_muc}>
                {category.ten_danh_muc}
              </option>
            ))}
          </select>
          <select
            value={warehouseFilter}
            onChange={(event) => setWarehouseFilter(event.target.value)}
          >
            <option value="tat_ca">Tất cả kho</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id_kho_hang} value={warehouse.id_kho_hang}>
                {warehouse.ten_kho}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ProductStatus | "tat_ca")
            }
          >
            <option value="tat_ca">Tất cả trạng thái</option>
            <option value="dang_ban">Đang bán</option>
            <option value="ngung_ban">Ngừng bán</option>
            <option value="het_hang">Hết hàng</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">Đang tải dữ liệu...</div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">Không có sản phẩm phù hợp</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const firstImage = parseImages(product.hinh_anh)[0];
                  return (
                    <tr key={product.id_san_pham}>
                      <td>
                        {firstImage ? (
                          <img
                            className="admin-product-thumb"
                            src={firstImage}
                            alt={product.ten_san_pham}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <strong>{product.ten_san_pham}</strong>
                        <span>#{product.id_san_pham} · {product.xuat_xu || "Chưa rõ xuất xứ"}</span>
                      </td>
                      <td>{product.DanhMuc?.ten_danh_muc || `#${product.id_danh_muc}`}</td>
                      <td>
                        <strong>{formatMoney(product.gia)}</strong>
                        <span>{product.don_vi_tinh || "đơn vị"}</span>
                      </td>
                      <td>
                        {renderWarehouseStocks(product)}
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            product.trang_thai === "dang_ban"
                              ? "green"
                              : product.trang_thai === "het_hang"
                                ? "yellow"
                                : "gray"
                          }`}
                        >
                          {statusLabels[product.trang_thai]}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button type="button" onClick={() => openEdit(product)}>
                            Sửa
                          </button>
                          <button type="button" onClick={() => openStockModal(product)}>
                            Kho
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              quickStatus(
                                product,
                                product.trang_thai === "dang_ban"
                                  ? "ngung_ban"
                                  : "dang_ban"
                              )
                            }
                          >
                            {product.trang_thai === "dang_ban" ? "Ngừng" : "Bán"}
                          </button>
                          <button type="button" onClick={() => hideProduct(product)}>
                            Ẩn
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal wide">
            <div className="admin-modal__header">
              <div>
                <h2>{editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h2>
                <p>Ảnh mới chỉ thay thế khi chọn file upload.</p>
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
                Danh mục *
                <select
                  value={form.id_danh_muc}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, id_danh_muc: event.target.value }))
                  }
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id_danh_muc} value={category.id_danh_muc}>
                      {category.ten_danh_muc}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tên sản phẩm *
                <input
                  value={form.ten_san_pham}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, ten_san_pham: event.target.value }))
                  }
                />
              </label>
              <label>
                Giá bán *
                <input
                  type="number"
                  min="1"
                  value={form.gia}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, gia: event.target.value }))
                  }
                />
              </label>
              <label>
                Đơn vị tính
                <input
                  value={form.don_vi_tinh || ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, don_vi_tinh: event.target.value }))
                  }
                  placeholder="chai, bao, kg..."
                />
              </label>
              <label>
                Kho nhập hàng
                <select
                  value={form.id_kho_hang || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      id_kho_hang: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn kho nếu nhập tồn</option>
                  {warehouses.length > 0 && (
                    <option value="" disabled>
                      --- Kho đã tạo ---
                    </option>
                  )}
                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse.id_kho_hang}
                      value={`warehouse:${warehouse.id_kho_hang}`}
                    >
                      {warehouse.ten_kho}
                    </option>
                  ))}
                  {departurePoints.length > 0 && (
                    <option value="" disabled>
                      --- Địa chỉ kinh doanh ---
                    </option>
                  )}
                  {departurePoints.map((point) => (
                    <option
                      key={point.id_diem_xuat_phat}
                      value={`departure:${point.id_diem_xuat_phat}`}
                    >
                      {point.ten_diem} - {point.dia_chi}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tồn tại kho
                <input
                  type="number"
                  min="0"
                  value={form.so_luong_kho || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      so_luong_kho: event.target.value,
                    }))
                  }
                  placeholder="Số lượng ở kho đã chọn"
                />
              </label>
              <label>
                Tồn tối thiểu tại kho
                <input
                  type="number"
                  min="0"
                  value={form.ton_kho_toi_thieu || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ton_kho_toi_thieu: event.target.value,
                    }))
                  }
                  placeholder="Thông báo khi tồn kho bằng hoặc thấp hơn mức này"
                />
              </label>
              <label>
                Xuất xứ
                <input
                  value={form.xuat_xu || ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, xuat_xu: event.target.value }))
                  }
                />
              </label>
              <label>
                Hạn sử dụng
                <input
                  type="date"
                  value={form.han_su_dung || ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, han_su_dung: event.target.value }))
                  }
                />
              </label>
              <label>
                Trạng thái
                <select
                  value={form.trang_thai || "dang_ban"}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      trang_thai: event.target.value as ProductStatus,
                    }))
                  }
                >
                  <option value="dang_ban">Đang bán</option>
                  <option value="ngung_ban">Ngừng bán</option>
                  <option value="het_hang">Hết hàng</option>
                </select>
              </label>
              <label>
                Ảnh sản phẩm
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      images: event.target.files || undefined,
                    }))
                  }
                />
              </label>
              <label className="full">
                Mô tả
                <textarea
                  value={form.mo_ta || ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, mo_ta: event.target.value }))
                  }
                />
              </label>
              <label className="full">
                Công dụng
                <textarea
                  value={form.cong_dung || ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, cong_dung: event.target.value }))
                  }
                />
              </label>
              <label className="full">
                Hướng dẫn sử dụng
                <textarea
                  value={form.huong_dan_su_dung || ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      huong_dan_su_dung: event.target.value,
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

      {stockProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Cập nhật tồn kho theo kho</h2>
                <p>{stockProduct.ten_san_pham}</p>
              </div>
              <button
                className="admin-modal__close"
                type="button"
                onClick={() => setStockProduct(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-sales-form">
              <label>
                Kho hàng *
                <select
                  value={stockForm.id_kho_hang}
                  onChange={(event) =>
                    setStockForm((prev) => ({
                      ...prev,
                      id_kho_hang: event.target.value,
                    }))
                  }
                >
                  <option value="">Chọn kho</option>
                  {warehouses.length > 0 && (
                    <option value="" disabled>
                      --- Kho đã tạo ---
                    </option>
                  )}
                  {warehouses.map((warehouse) => (
                    <option
                      key={warehouse.id_kho_hang}
                      value={`warehouse:${warehouse.id_kho_hang}`}
                    >
                      {warehouse.ten_kho}
                    </option>
                  ))}
                  {departurePoints.length > 0 && (
                    <option value="" disabled>
                      --- Địa chỉ kinh doanh ---
                    </option>
                  )}
                  {departurePoints.map((point) => (
                    <option
                      key={point.id_diem_xuat_phat}
                      value={`departure:${point.id_diem_xuat_phat}`}
                    >
                      {point.ten_diem} - {point.dia_chi}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Số lượng tồn *
                <input
                  type="number"
                  min="0"
                  value={stockForm.so_luong}
                  onChange={(event) =>
                    setStockForm((prev) => ({
                      ...prev,
                      so_luong: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Tồn tối thiểu
                <input
                  type="number"
                  min="0"
                  value={stockForm.ton_kho_toi_thieu}
                  onChange={(event) =>
                    setStockForm((prev) => ({
                      ...prev,
                      ton_kho_toi_thieu: event.target.value,
                    }))
                  }
                  placeholder="Thông báo admin khi tồn thấp"
                />
              </label>
              <label className="full">
                Ghi chú
                <textarea
                  value={stockForm.ghi_chu}
                  onChange={(event) =>
                    setStockForm((prev) => ({
                      ...prev,
                      ghi_chu: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-secondary-btn"
                type="button"
                onClick={() => setStockProduct(null)}
              >
                Hủy
              </button>
              <button className="admin-primary-btn" type="button" onClick={submitStock}>
                Cập nhật tồn kho
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarehouseModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <div>
                <h2>Thêm kho hàng</h2>
                <p>Kho dùng để phân bổ tồn kho sản phẩm.</p>
              </div>
              <button
                className="admin-modal__close"
                type="button"
                onClick={() => setShowWarehouseModal(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-sales-form">
              <label className="full">
                Địa chỉ kinh doanh *
                <select
                  value={warehouseForm.id_diem_xuat_phat}
                  onChange={(event) => {
                    const selectedPoint = departurePoints.find(
                      (point) =>
                        String(point.id_diem_xuat_phat) === event.target.value
                    );
                    setWarehouseForm((prev) => ({
                      ...prev,
                      id_diem_xuat_phat: event.target.value,
                      ten_kho: selectedPoint?.ten_diem || "",
                    }));
                  }}
                >
                  <option value="">Chọn địa chỉ/kho/cửa hàng đã cấu hình</option>
                  {departurePoints.map((point) => (
                    <option
                      key={point.id_diem_xuat_phat}
                      value={point.id_diem_xuat_phat}
                    >
                      {point.ten_diem} - {point.dia_chi}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tên kho
                <input
                  value={warehouseForm.ten_kho}
                  onChange={(event) =>
                    setWarehouseForm((prev) => ({
                      ...prev,
                      ten_kho: event.target.value,
                    }))
                  }
                  placeholder="Mặc định lấy theo tên địa chỉ kinh doanh"
                />
              </label>
              <label>
                Trạng thái
                <select
                  value={warehouseForm.trang_thai}
                  onChange={(event) =>
                    setWarehouseForm((prev) => ({
                      ...prev,
                      trang_thai: event.target.value as "hoat_dong" | "tam_ngung",
                    }))
                  }
                >
                  <option value="hoat_dong">Hoạt động</option>
                  <option value="tam_ngung">Tạm ngưng</option>
                </select>
              </label>
              {warehouseForm.id_diem_xuat_phat && (
                <div className="admin-warehouse-address-preview full">
                  {(() => {
                    const selectedPoint = departurePoints.find(
                      (point) =>
                        String(point.id_diem_xuat_phat) ===
                        String(warehouseForm.id_diem_xuat_phat)
                    );

                    if (!selectedPoint) return null;

                    return (
                      <>
                        <strong>{selectedPoint.dia_chi}</strong>
                        <span>
                          {selectedPoint.vi_do}, {selectedPoint.kinh_do}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
              <label className="full">
                Ghi chú
                <textarea
                  value={warehouseForm.ghi_chu}
                  onChange={(event) =>
                    setWarehouseForm((prev) => ({
                      ...prev,
                      ghi_chu: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="admin-modal__actions">
              <button
                className="admin-secondary-btn"
                type="button"
                onClick={() => setShowWarehouseModal(false)}
              >
                Hủy
              </button>
              <button className="admin-primary-btn" type="button" onClick={submitWarehouse}>
                Lưu kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
