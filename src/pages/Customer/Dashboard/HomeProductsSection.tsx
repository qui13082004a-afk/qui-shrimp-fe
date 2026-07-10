import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Hourglass, ShoppingBag, ShoppingCart } from "lucide-react";

interface Product {
  id_san_pham: number;
  id_danh_muc: number;
  ten_san_pham: string;
  mo_ta?: string;
  gia: string | number;
  hinh_anh?: string;
  is_ban_chay?: boolean;
}

interface HomeProductsSectionProps {
  products: Product[];
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300";

export const HomeProductsSection: React.FC<HomeProductsSectionProps> = ({
  products,
}) => {
  const navigate = useNavigate();

  const uniqueProducts = Array.from(
    new Map(products.map((item) => [item.id_san_pham, item])).values()
  );

  const latestThreeProducts = uniqueProducts.slice(0, 3);

  const getImageUrl = (image?: string) => {
    if (!image) return DEFAULT_IMAGE;

    try {
      const parsedImages = JSON.parse(image);
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        return parsedImages[0];
      }
    } catch {
      if (image.startsWith("http")) return image;
    }

    return DEFAULT_IMAGE;
  };

  const formatPrice = (price: string | number) => {
    const parsedPrice = Number(price || 0);
    if (Number.isNaN(parsedPrice) || parsedPrice === 0) return "Liên hệ";
    return `${parsedPrice.toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="home-products-section">
      <div className="section-header">
        <h3>
          <ShoppingBag size={20} className="section-title-icon" />
          Sản phẩm mới về
        </h3>

        <button
          type="button"
          className="btn-view-all"
          onClick={() => navigate("/store")}
        >
          Đến cửa hàng
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="home-products-grid">
        {latestThreeProducts.length > 0 ? (
          latestThreeProducts.map((prod) => (
            <div
              key={prod.id_san_pham}
              className="home-product-card"
              onClick={() => navigate(`/product/${prod.id_san_pham}`)}
              role="button"
              tabIndex={0}
            >
              <div className="product-img-holder">
                <img
                  src={getImageUrl(prod.hinh_anh)}
                  alt={prod.ten_san_pham}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_IMAGE;
                  }}
                />
                {prod.is_ban_chay && <span className="badge-hot">Bán chạy</span>}
              </div>

              <div className="product-detail-box">
                <h5>{prod.ten_san_pham}</h5>
                <p>{prod.mo_ta || "Vật tư nuôi trồng chất lượng cao"}</p>

                <div className="product-footer">
                  <span className="product-price">{formatPrice(prod.gia)}</span>
                  <button
                    type="button"
                    className="btn-quick-cart"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/store");
                    }}
                    aria-label="Đến cửa hàng"
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="products-empty">Chưa có sản phẩm nào trong hệ thống.</p>
        )}

        <div className="placeholder-card">
          <Hourglass size={28} />
          <h5>Vật tư sắp về</h5>
          <p>Sẽ có mặt trong vài ngày tới</p>
        </div>
      </div>
    </div>
  );
};
