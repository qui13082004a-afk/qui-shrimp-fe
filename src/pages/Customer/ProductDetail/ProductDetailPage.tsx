import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById } from "../../../services/product.service";
import axios from "../../../lib/axios"; 
import "./ProductDetailPage.css";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("detail");
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      try {
        setLoading(true);
        if (id) {
          // 1. Lấy chi tiết sản phẩm hiện tại từ API
          const res = await getProductById(id);
          const currentProduct = res.data;
          setProduct(currentProduct);
          setSelectedImgIndex(0); 

          // 2. Lấy sản phẩm liên quan (Bỏ /api thừa để tránh lỗi /api/api)
          if (currentProduct?.id_danh_muc) {
            const relatedRes = await axios.get(
              `/products?page=1&limit=4&id_danh_muc=${currentProduct.id_danh_muc}`
            );
            const filteredItems = (relatedRes.data?.data || []).filter(
              (item: any) => item.id_san_pham !== currentProduct.id_san_pham
            );
            setRelatedProducts(filteredItems);
          }
        }
      } catch (error) {
        console.error("Lỗi lấy chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndRelated();
  }, [id]);

  const getImagesArray = (hinhAnhStr: string) => {
    if (!hinhAnhStr) return ["/shrimp-farm.jpg"];
    try {
      return JSON.parse(hinhAnhStr);
    } catch {
      return [hinhAnhStr];
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existed = cart.find((item: any) => item.id_san_pham === product.id_san_pham);
    const productImages = getImagesArray(product.hinh_anh);

    if (existed) {
      existed.so_luong += quantity;
    } else {
      cart.push({
        id_san_pham: product.id_san_pham,
        ten_san_pham: product.ten_san_pham,
        gia: Number(product.gia),
        hinh_anh: productImages[0],
        so_luong: quantity,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
  };

  // =========================================================
  // XỬ LÝ LOADING THÔNG MINH: Giữ khung để Footer bám đáy, chữ ở giữa
  // =========================================================
  if (loading) {
    return (
      <div className="product-detail-page" style={{ 
        minHeight: "65vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: 600,
        color: "#004b7a"
      }}>
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  // Xử lý khi lỗi không tìm thấy dữ liệu từ API
  if (!product) {
    return (
      <div className="product-detail-page" style={{ 
        minHeight: "65vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontSize: "15px",
        color: "#64748b"
      }}>
        Không tìm thấy sản phẩm yêu cầu!
      </div>
    );
  }

  // Khi đã có dữ liệu sản phẩm, tiến hành render bình thường
  const images = getImagesArray(product.hinh_anh);
  const warehouseStocks = Array.isArray(product.TonKhoSanPhams)
    ? product.TonKhoSanPhams.filter((stock: any) => Number(stock.so_luong || 0) > 0)
    : [];

  return (
    <div className="product-detail-page">
      {/* 1. Đường dẫn Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/store">Cửa hàng</Link>
        <span>&gt;</span>
        <Link to={`/store?id_danh_muc=${product.id_danh_muc}`}>
          {product.DanhMuc?.ten_danh_muc || "Chế phẩm sinh học"}
        </Link>
        <span>&gt;</span>
        <span className="current-crumb">Chi tiết sản phẩm</span>
      </div>

      {/* 2. Khối thông tin hình ảnh và đặt hàng */}
      <div className="product-essential">
        <div className="product-gallery">
          <div className="main-image">
            <img src={images[selectedImgIndex]} alt={product.ten_san_pham} />
          </div>
          {images.length > 1 && (
            <div className="thumb-images">
              {images.map((img: string, index: number) => (
                <button
                  key={index}
                  className={`thumb-btn ${selectedImgIndex === index ? "active" : ""}`}
                  onClick={() => setSelectedImgIndex(index)}
                >
                  <img src={img} alt={`thumb-${index}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info-main">
          <span className="badge-best-seller">BÁN CHẠY NHẤT</span>
          <h1>{product.ten_san_pham}</h1>
          
          <div className="product-price">
            {Number(product.gia).toLocaleString("vi-VN")}đ
          </div>

          <div className="product-meta-spec">
            <p>📦 <strong>Đơn vị tính:</strong> {product.don_vi_tinh || "Chưa xác định"}</p>
            <p>🏭 <strong>Xuất xứ:</strong> {product.xuat_xu || "Việt Nam"}</p>
            <p>⏳ <strong>Hạn sử dụng:</strong> {product.han_su_dung ? new Date(product.han_su_dung).toLocaleDateString("vi-VN") : "Xem trên bao bì"}</p>
            <p>🗃️ <strong>Tình trạng kho:</strong> {product.ton_kho > 0 ? `Còn hàng (${product.ton_kho})` : "Tạm hết hàng"}</p>
          </div>

          <div className="product-warehouse-stock">
            <div className="product-warehouse-stock__header">
              <strong>Tồn kho theo kho</strong>
              <span>{Number(product.ton_kho || 0).toLocaleString("vi-VN")} sản phẩm</span>
            </div>

            {warehouseStocks.length > 0 ? (
              <div className="product-warehouse-stock__list">
                {warehouseStocks.map((stock: any) => (
                  <div
                    className="product-warehouse-stock__item"
                    key={stock.id_ton_kho || `${stock.id_kho_hang}-${stock.so_luong}`}
                  >
                    <div>
                      <strong>
                        {stock.KhoHang?.ten_kho || `Kho #${stock.id_kho_hang}`}
                      </strong>
                      <span>
                        {stock.KhoHang?.dia_chi || "Chưa cập nhật địa chỉ kho"}
                      </span>
                    </div>
                    <b>{Number(stock.so_luong || 0).toLocaleString("vi-VN")}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="product-warehouse-stock__empty">
                Chưa có thông tin tồn kho theo từng kho.
              </p>
            )}
          </div>

          <p className="product-desc-short">
            {product.mo_ta || "Chế phẩm sinh học chất lượng cao chuyên dùng cho ao nuôi thủy sản."}
          </p>

          <div className="purchase-actions">
            <div className="quantity-selector">
              <span>SỐ LƯỢNG:</span>
              <div className="quantity-controls">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val > 0) setQuantity(val);
                  }}
                />
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
            </div>
            <div className="btn-group">
              <button className="btn-add-cart" onClick={handleAddToCart}> Thêm vào giỏ hàng</button>
              <button className="btn-buy-now" onClick={() => {
                handleAddToCart();
                navigate("/cart");
              }}>Mua ngay</button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Khối điều hướng TABS mô tả chi tiết (Đã lược bỏ khối sidebar-notice thừa) */}
      <div className="product-tabs-section">
        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === "detail" ? "active" : ""}`}
            onClick={() => setActiveTab("detail")}
          >
            Chi tiết sản phẩm
          </button>
          <button
            className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Đánh giá khách hàng
          </button>
        </div>

        {activeTab === "detail" ? (
          <div className="tabs-content-layout">
            <div className="main-tab-info" style={{ flex: 1 }}>
              <div className="info-section">
                <h3>🧪 Thành phần chính & Công dụng</h3>
                <p>{product.cong_dung || "Đang cập nhật dữ liệu thành phần..."}</p>
              </div>
              <div className="info-section">
                <h3>📋 Hướng dẫn sử dụng hiệu quả</h3>
                <p>{product.huong_dan_su_dung || "Vui lòng xem hướng dẫn chi tiết in trên mặt sau bao bì sản phẩm."}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="main-tab-info-empty">
            Chưa có đánh giá nào cho sản phẩm này từ cộng đồng bà con nuôi tôm.
          </div>
        )}
      </div>

      {/* 4. Khối sản phẩm liên quan */}
      <div className="related-products-section">
        <div className="related-header">
          <h2>Sản phẩm liên quan</h2>
          <p>Gợi ý vật tư phù hợp tối ưu cho ao nuôi tôm của bạn</p>
          <Link to={`/store?id_danh_muc=${product.id_danh_muc}`} className="view-all-link">Xem tất cả →</Link>
        </div>

        <div className="related-grid">
          {relatedProducts.length === 0 ? (
            <p className="no-related">Đang cập nhật các sản phẩm cùng loại...</p>
          ) : (
            relatedProducts.map((item) => {
              const itemImages = getImagesArray(item.hinh_anh);
              return (
                <div 
                  key={item.id_san_pham} 
                  className="related-card"
                  onClick={() => navigate(`/product/${item.id_san_pham}`)} 
                >
                  <div className="related-card__image">
                    <img src={itemImages[0]} alt={item.ten_san_pham} />
                  </div>
                  <div className="related-card__body">
                    <span className="related-card__cat">{product.DanhMuc?.ten_danh_muc || "VẬT TƯ"}</span>
                    <h3>{item.ten_san_pham}</h3>
                    <p className="related-card__price">{Number(item.gia).toLocaleString("vi-VN")}đ</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
