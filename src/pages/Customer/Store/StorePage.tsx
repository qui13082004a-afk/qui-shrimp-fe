import { useEffect, useState } from "react";
import {
    Search,
    ShoppingCart,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../../../services/product.service";
import { getCategories } from "../../../services/category.service";
import {
    warehouseService,
    type Warehouse,
} from "../../../services/warehouse.service";
import { toastSuccess, toastError } from "../../../utils/notify";
import "./StorePage.css";

const LIMIT = 12;

const StorePage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categoryKeyword, setCategoryKeyword] = useState("");
    const [pagination, setPagination] = useState<any>(null);
    const [page, setPage] = useState(1);

    const [searchKeyword, setSearchKeyword] = useState("");
    const [keyword, setKeyword] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [priceFilter, setPriceFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [showLoadingVisual, setShowLoadingVisual] = useState(false);

    const getProductImage = (hinh_anh: string) => {
        if (!hinh_anh) return "/shrirmp-farm.jpg";

        try {
            const images = JSON.parse(hinh_anh);
            return images?.[0] || "/shrirmp-farm.jpg";
        } catch {
            return hinh_anh || "/shrirmp-farm.jpg";
        }
    };

    useEffect(() => {
        if (searchKeyword === "" && keyword === "") return;

        const timeout = setTimeout(() => {
            setPage(1);
            setKeyword(searchKeyword);
        }, 500);

        return () => clearTimeout(timeout);
    }, [searchKeyword, keyword]);

    useEffect(() => {
        let loadingTimeout: any;

        const fetchData = async () => {
            try {
                setLoading(true);

                loadingTimeout = setTimeout(() => {
                    setShowLoadingVisual(true);
                }, 150);

                let minPrice: number | null = null;
                let maxPrice: number | null = null;

                switch (priceFilter) {
                    case "under100":
                        maxPrice = 100000;
                        break;
                    case "100-500":
                        minPrice = 100000;
                        maxPrice = 500000;
                        break;
                    case "over500":
                        minPrice = 500000;
                        break;
                    default:
                        break;
                }

                const requestParams = {
                    page,
                    limit: LIMIT,
                    keyword: keyword || "",
                    id_danh_muc: selectedCategory || "",
                    sortBy: sortBy || "newest",
                    minPrice: minPrice ?? "",
                    maxPrice: maxPrice ?? "",
                    id_kho_hang: selectedWarehouse || "",
                };

                const [productRes, categoryRes, warehouseRes] = await Promise.all([
                    getProducts(requestParams as any),
                    getCategories(),
                    warehouseService.getWarehouses({ activeOnly: true }),
                ]);

                setProducts(productRes.data || []);
                setPagination(productRes.pagination || null);
                setCategories(categoryRes.data || []);
                setWarehouses(warehouseRes.data || []);
            } catch (error) {
                console.log("STORE ERROR:", error);
                toastError("Không thể tải danh sách sản phẩm");
            } finally {
                clearTimeout(loadingTimeout);
                setLoading(false);
                setShowLoadingVisual(false);
            }
        };

        fetchData();

        return () => clearTimeout(loadingTimeout);
    }, [page, keyword, selectedCategory, selectedWarehouse, sortBy, priceFilter]);

    const uniqueCategories = categories.filter((category, index, self) => {
        const currentName = category.ten_danh_muc?.trim().toLowerCase();
        return (
            currentName &&
            index ===
                self.findIndex(
                    (item) => item.ten_danh_muc?.trim().toLowerCase() === currentName
                )
        );
    });

    const visibleCategories = uniqueCategories.slice(0, 4);

    const filteredCategories = uniqueCategories.filter((category) =>
        category.ten_danh_muc
            ?.toLowerCase()
            .includes(categoryKeyword.trim().toLowerCase())
    );

    const handleSelectCategory = (categoryId: number | null) => {
        setPage(1);
        setSelectedCategory(categoryId);
        setShowCategoryModal(false);
        setCategoryKeyword("");
    };

    const handleAddToCart = (product: any) => {
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            const existed = cart.find(
                (item: any) => item.id_san_pham === product.id_san_pham
            );

            if (existed) {
                existed.so_luong += 1;
            } else {
                cart.push({
                    id_san_pham: product.id_san_pham,
                    ten_san_pham: product.ten_san_pham,
                    gia: Number(product.gia),
                    hinh_anh: getProductImage(product.hinh_anh),
                    so_luong: 1,
                });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            toastSuccess("Đã thêm vào giỏ hàng");
        } catch (error) {
            console.log("ADD CART ERROR:", error);
            toastError("Không thể thêm vào giỏ hàng");
        }
    };

    return (
        <div className="store-page">
            <aside className="store-sidebar">
                <h2>Danh mục</h2>

                <button
                    className={`store-category ${selectedCategory === null ? "active" : ""}`}
                    onClick={() => handleSelectCategory(null)}
                >
                    <span>Tất cả sản phẩm</span>
                    <span>›</span>
                </button>

                {visibleCategories.length > 0 && (
                    <p className="store-category-section-title">Danh mục phổ biến</p>
                )}

                {visibleCategories.map((category) => (
                    <button
                        key={category.id_danh_muc}
                        className={`store-category ${
                            selectedCategory === category.id_danh_muc ? "active" : ""
                        }`}
                        onClick={() => handleSelectCategory(category.id_danh_muc)}
                    >
                        <span>{category.ten_danh_muc}</span>
                        <span>›</span>
                    </button>
                ))}

                {uniqueCategories.length > 4 && (
                    <button
                        type="button"
                        className="store-category-toggle"
                        onClick={() => setShowCategoryModal(true)}
                    >
                        <span>Xem tất cả {uniqueCategories.length} danh mục</span>
                        <span>→</span>
                    </button>
                )}

                <div className="store-sidebar__line" />
                <p className="store-filter-title">BỘ LỌC NÂNG CAO</p>

                <div className="store-filter-group">
                    <h4>Khoảng giá</h4>

                    <label>
                        <input
                            type="radio"
                            checked={priceFilter === "all"}
                            onChange={() => {
                                setPage(1);
                                setPriceFilter("all");
                            }}
                        />
                        <span>Tất cả</span>
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={priceFilter === "under100"}
                            onChange={() => {
                                setPage(1);
                                setPriceFilter("under100");
                            }}
                        />
                        <span>Dưới 100.000đ</span>
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={priceFilter === "100-500"}
                            onChange={() => {
                                setPage(1);
                                setPriceFilter("100-500");
                            }}
                        />
                        <span>100.000đ - 500.000đ</span>
                    </label>

                    <label>
                        <input
                            type="radio"
                            checked={priceFilter === "over500"}
                            onChange={() => {
                                setPage(1);
                                setPriceFilter("over500");
                            }}
                        />
                        <span>Trên 500.000đ</span>
                    </label>
                </div>

                <div className="store-filter-group">
                    <h4>Kho hàng</h4>

                    <select
                        className="store-filter-select"
                        value={selectedWarehouse}
                        onChange={(event) => {
                            setPage(1);
                            setSelectedWarehouse(event.target.value);
                        }}
                    >
                        <option value="">Tất cả kho</option>
                        {warehouses.map((warehouse) => (
                            <option
                                key={warehouse.id_kho_hang}
                                value={warehouse.id_kho_hang}
                            >
                                {warehouse.ten_kho}
                            </option>
                        ))}
                    </select>
                </div>

            </aside>

            <section className="store-content">
                <div className="store-toolbar">
                    <div className="store-search">
                        <Search size={22} />
                        <input
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                        />
                    </div>

                    <div className="store-count">
                        Tìm thấy <span>{pagination?.totalItems || 0}</span> sản phẩm
                    </div>

                    <div className="store-sort">
                        <label>Sắp xếp</label>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setPage(1);
                                setSortBy(e.target.value);
                            }}
                        >
                            <option value="priceAsc">Giá: Tăng dần</option>
                            <option value="priceDesc">Giá: Giảm dần</option>
                            <option value="nameAsc">Tên: A-Z</option>
                            <option value="nameDesc">Tên: Z-A</option>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="stockDesc">Tồn kho giảm dần</option>
                        </select>
                    </div>
                </div>

                <div
                    className="store-grid-container"
                    style={{ position: "relative", minHeight: "300px" }}
                >
                    {loading && showLoadingVisual && (
                        <div
                            className="store-inline-loading"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255, 255, 255, 0.7)",
                                zIndex: 10,
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#004b7a",
                            }}
                        >
                            Đang cập nhật danh sách...
                        </div>
                    )}

                    <div
                        className="store-grid"
                        style={{
                            opacity: loading ? 0.4 : 1,
                            transition: "opacity 0.15s ease",
                        }}
                    >
                        {products.length === 0 && !loading && (
                            <div className="store-empty">
                                Không tìm thấy sản phẩm phù hợp
                            </div>
                        )}

                        {products.map((product) => (
                            <div
                                className="product-card"
                                key={product.id_san_pham}
                                onClick={() => navigate(`/product/${product.id_san_pham}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="product-card__image">
                                    <img
                                        src={getProductImage(product.hinh_anh)}
                                        alt={product.ten_san_pham}
                                        onError={(e) => {
                                            e.currentTarget.src = "/shrirmp-farm.jpg";
                                        }}
                                    />
                                </div>

                                <div className="product-card__body">
                                    <p className="product-card__category">
                                        {product.DanhMuc?.ten_danh_muc || "SẢN PHẨM"}
                                    </p>

                                    <h3>{product.ten_san_pham}</h3>

                                    <p className="product-card__brand">
                                        <span>Tồn kho: {product.ton_kho}</span>
                                        <span>{product.don_vi_tinh}</span>
                                    </p>

                                    <div className="product-card__bottom">
                                        <strong>
                                            {Number(product.gia).toLocaleString("vi-VN")}đ
                                        </strong>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(product);
                                            }}
                                        >
                                            <ShoppingCart size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="store-pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {Array.from(
                            { length: pagination.totalPages },
                            (_, i) => i + 1
                        ).map((pageNumber) => (
                            <button
                                key={pageNumber}
                                className={page === pageNumber ? "active" : ""}
                                onClick={() => setPage(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        ))}

                        <button
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {user?.vai_tro === "admin" && (
                    <button
                        className="store-floating-btn"
                        onClick={() => navigate("/admin/products/create")}
                    >
                        <Plus size={34} />
                    </button>
                )}
            </section>

            {showCategoryModal && (
                <div
                    className="category-modal-overlay"
                    onClick={() => setShowCategoryModal(false)}
                >
                    <div
                        className="category-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="category-modal__header">
                            <div>
                                <p>DANH MỤC SẢN PHẨM</p>
                                <h3>Chọn nhanh danh mục</h3>
                            </div>

                            <button
                                type="button"
                                className="category-modal__close"
                                onClick={() => setShowCategoryModal(false)}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="category-modal__search">
                            <Search size={20} />
                            <input
                                value={categoryKeyword}
                                onChange={(e) => setCategoryKeyword(e.target.value)}
                                placeholder="Tìm danh mục..."
                                autoFocus
                            />
                        </div>

                        <div className="category-modal__grid">
                            <button
                                type="button"
                                className={`category-modal__item ${
                                    selectedCategory === null ? "active" : ""
                                }`}
                                onClick={() => handleSelectCategory(null)}
                            >
                                Tất cả sản phẩm
                            </button>

                            {filteredCategories.map((category) => (
                                <button
                                    type="button"
                                    key={category.id_danh_muc}
                                    className={`category-modal__item ${
                                        selectedCategory === category.id_danh_muc
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => handleSelectCategory(category.id_danh_muc)}
                                >
                                    {category.ten_danh_muc}
                                </button>
                            ))}

                            {filteredCategories.length === 0 && (
                                <div className="category-modal__empty">
                                    Không tìm thấy danh mục
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorePage;
