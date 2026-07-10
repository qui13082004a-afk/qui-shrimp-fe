import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { pondService } from "../../../services/pond.service";
import type { Pond } from "../Ponds/PondCard";

import { customerProfileService } from "../../../services/customerProfile.service";

import { cropSeasonService } from "../../../services/cropSeason.service";
import type { CropSeason } from "../../../services/cropSeason.service";

import axios from "../../../lib/axios";

import { HomePondCard } from "./HomePondCard";
import { HomeWeatherCard } from "./HomeWeatherCard";
import { HomeProductsSection } from "./HomeProductsSection";

import "./Dashboard.css";

interface Product {
  id_san_pham: number;
  id_danh_muc: number;
  ten_san_pham: string;
  mo_ta?: string;
  gia: number;
  hinh_anh?: string;
  is_ban_chay?: boolean;
}

interface Order {
  id_don_hang: number;
  trang_thai_don_hang: string;
}

interface CustomerProfileDebt {
  dinh_muc_cong_no?: number | string | null;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [allCropSeasons, setAllCropSeasons] = useState<CropSeason[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("Thành viên");

  const loadDashboardData = async () => {
    try {
      // 1. Thông tin tài khoản
      const userRes = await axios.get("/auth/me");

      if (userRes.data?.success) {
        setUserName(
          userRes.data.data?.ho_ten ||
            userRes.data.data?.ten_dang_nhap ||
            "Thành viên"
        );
      }

      // 2. Danh sách ao nuôi
      const pondRes = await pondService.getMyPonds();

      if (pondRes?.success) {
        const pondList: Pond[] = Array.isArray(pondRes.data)
          ? pondRes.data
          : [];

        setPonds(pondList);

        const seasonsAccumulator: CropSeason[] = [];

        for (const pond of pondList) {
          try {
            const seasonRes =
              await cropSeasonService.getCropSeasonsByPond(pond.id_ao);

            if (seasonRes?.success && Array.isArray(seasonRes.data)) {
              seasonsAccumulator.push(...seasonRes.data);
            }
          } catch (error) {
            console.error(
              `Không tải được vụ nuôi của ao ${pond.id_ao}:`,
              error
            );
          }
        }

        setAllCropSeasons(seasonsAccumulator);
      }

      // 3. Tổng hạn mức công nợ
      const profileRes =
        await customerProfileService.getMyCustomerProfiles();

      if (profileRes?.success) {
        const profiles: CustomerProfileDebt[] = Array.isArray(profileRes.data)
          ? profileRes.data
          : [];

        const sum = profiles.reduce(
          (acc: number, curr: CustomerProfileDebt) =>
            acc + Number(curr.dinh_muc_cong_no || 0),
          0
        );

        setTotalDebt(sum);
      }

      // 4. Danh sách đơn hàng
      const orderRes = await axios.get("/orders/my");

      if (orderRes.data?.success) {
        const orders: Order[] = Array.isArray(orderRes.data.data)
          ? orderRes.data.data
          : [];

        const pendingOrders = orders.filter(
          (order: Order) =>
            order.trang_thai_don_hang === "cho_xu_ly" ||
            order.trang_thai_don_hang === "cho_giao"
        );

        setNewOrdersCount(pendingOrders.length);
      }

      // 5. Danh sách sản phẩm
      const productRes = await axios.get("/products");

      if (productRes.data?.success) {
        const productList: Product[] = Array.isArray(productRes.data.data)
          ? productRes.data.data
          : [];

        setProducts(productList);
      }
    } catch (error) {
      console.error("Lỗi đồng bộ API trên Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const warningPondsCount = ponds.filter((pond) => {
    const pondName = pond.ten_ao?.toLowerCase() || "";

    return pondName.includes("04") || pondName.includes("cảnh báo");
  }).length;

  if (loading) {
    return (
      <div className="ponds-loading">
        Đang tải bảng điều khiển nông trại...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <h1>Chào ông {userName},</h1>

        <div className="system-status">
          <span className="status-dot" />
          Hệ thống vận hành ổn định • Cập nhật vừa xong
        </div>
      </div>

      <div className="widgets-grid">
        <div className="widget-card">
          <div className="widget-info">
            <span>Tổng số ao nuôi</span>

            <h2>
              {ponds.length < 10 ? `0${ponds.length}` : ponds.length}
              <small>Ao</small>
            </h2>
          </div>

          <div
            className="widget-icon-box"
            style={{
              background: "#e0f2fe",
              color: "#0369a1",
            }}
          >
            <i className="fa-solid fa-droplet" />
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-info">
            <span>Tổng hạn mức công nợ</span>

            <h2>
              {totalDebt >= 1_000_000_000
                ? `${(totalDebt / 1_000_000_000).toFixed(3)} tỷ`
                : totalDebt >= 1_000_000
                  ? `${(totalDebt / 1_000_000).toFixed(1)} tr đ`
                  : `${totalDebt.toLocaleString("vi-VN")} đ`}
            </h2>
          </div>

          <div
            className="widget-icon-box"
            style={{
              background: "#fef2f2",
              color: "#dc2626",
            }}
          >
            <i className="fa-solid fa-wallet" />
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-info">
            <span>Ao cần chú ý</span>

            <h2>
              {warningPondsCount < 10
                ? `0${warningPondsCount}`
                : warningPondsCount}
              <small>Ao</small>
            </h2>
          </div>

          <div
            className="widget-icon-box"
            style={{
              background: "#f0fdf4",
              color: "#16a34a",
            }}
          >
            <i className="fa-solid fa-chart-line" />
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-info">
            <span>Đơn hàng mới</span>

            <h2>
              {newOrdersCount < 10
                ? `0${newOrdersCount}`
                : newOrdersCount}
              <small>Đơn</small>
            </h2>
          </div>

          <div
            className="widget-icon-box"
            style={{
              background: "#fdf6b2",
              color: "#7e22ce",
            }}
          >
            <i className="fa-solid fa-basket-shopping" />
          </div>
        </div>
      </div>

      <div className="main-dashboard-layout">
        <div>
          <div className="section-header">
            <h3>
              <i
                className="fa-solid fa-grip"
                style={{ color: "#0284c7" }}
              />{" "}
              Quản lý Ao nuôi
            </h3>

            <span
              onClick={() => navigate("/ponds")}
              className="btn-view-all"
              role="button"
              tabIndex={0}
            >
              Xem tất cả
            </span>
          </div>

          <div className="home-ponds-grid">
            {ponds.slice(0, 4).map((pond) => {
              const pondCrop = allCropSeasons.find(
                (crop) =>
                  crop.id_ao === pond.id_ao &&
                  crop.trang_thai === "dang_nuoi"
              );

              return (
                <HomePondCard
                  key={pond.id_ao}
                  pond={pond}
                  activeCrop={pondCrop}
                  onActionClick={() => navigate("/ponds")}
                />
              );
            })}
          </div>
        </div>

        <aside className="aside-widgets-stack">
          <div className="quick-tools-box">
            <h4>
              <i className="fa-regular fa-compass" /> Tiện ích nhanh
            </h4>

            <div className="tools-buttons-list">
              <button
                type="button"
                onClick={() => navigate("/store")}
                className="btn-tool-link"
              >
                <i className="fa-solid fa-cart-shopping" />
                Mua vật tư trả sau
              </button>

              <button
                type="button"
                onClick={() => navigate("/ponds")}
                className="btn-tool-link"
              >
                <i className="fa-regular fa-clipboard" />
                Ghi nhật ký nuôi
              </button>
            </div>
          </div>

          <HomeWeatherCard
            firstPondAddress={ponds[0]?.dia_chi_ao}
          />
        </aside>
      </div>

      <HomeProductsSection products={products} />
    </div>
  );
};

export default DashboardPage;