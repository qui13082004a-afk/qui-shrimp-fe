import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pondService } from '../../../services/pond.service';
import type { Pond } from '../Ponds/PondCard';
import { customerProfileService } from '../../../services/customerProfile.service';
import { cropSeasonService } from '../../../services/cropSeason.service';
import type { CropSeason } from '../../../services/cropSeason.service';
import axios from '../../../lib/axios';

// IMPORT CÁC COMPONENT CON CÙNG CẤP THƯ MỤC
import { HomePondCard } from './HomePondCard';
import { HomeWeatherCard } from './HomeWeatherCard';
import { HomeProductsSection } from './HomeProductsSection';

import './Dashboard.css';

interface Product {
  id_san_pham: number;
  id_danh_muc: number;
  ten_san_pham: string;
  mo_ta?: string; // Khớp với Model SanPham.js
  gia: number; // Khớp với Model SanPham.js
  hinh_anh?: string; // Sửa từ hinh_anh_url thành hinh_anh để khớp chuẩn với Model
  is_ban_chay?: boolean;
}

interface Order {
  id_don_hang: number;
  trang_thai_don_hang: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [ponds, setPonds] = useState<Pond[]>([]);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [allCropSeasons, setAllCropSeasons] = useState<CropSeason[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('Thành viên');

  const loadDashboardData = async () => {
    try {
      // 1. Tải thông tin tài khoản đăng nhập
      const userRes = await axios.get('/auth/me');
      if (userRes.data && userRes.data.success) {
        setUserName(userRes.data.data.ho_ten || userRes.data.data.ten_dang_nhap);
      }

      // 2. Tải danh sách ao nuôi
      const pondRes = await pondService.getMyPonds();
      if (pondRes && pondRes.success) {
        setPonds(pondRes.data);
        
        // Tải toàn bộ lịch sử vụ nuôi
        const seasonsAccumulator: CropSeason[] = [];
        for (const p of pondRes.data) {
          const seasonRes = await cropSeasonService.getCropSeasonsByPond(p.id_ao);
          if (seasonRes.success) {
            seasonsAccumulator.push(...seasonRes.data);
          }
        }
        setAllCropSeasons(seasonsAccumulator);
      }

      // 3. Tính hạn mức công nợ trả sau
      const profileRes = await customerProfileService.getMyCustomerProfiles();
      if (profileRes && profileRes.success) {
        const sum = profileRes.data.reduce((acc, curr) => acc + Number(curr.dinh_muc_cong_no), 0);
        setTotalDebt(sum);
      }

      // 4. Lấy danh sách đơn hàng
      const orderRes = await axios.get('/orders/my');
      if (orderRes.data && orderRes.data.success) {
        const pendingOrders = orderRes.data.data.filter(
          (o: Order) => o.trang_thai_don_hang === 'cho_xu_ly' || o.trang_thai_don_hang === 'cho_giao'
        );
        setNewOrdersCount(pendingOrders.length);
      }

      // 5. Tải danh sách sản phẩm từ database
      const productRes = await axios.get('/products');
      if (productRes.data && productRes.data.success) {
        // CỐ ĐỊNH LỖI LẶP: Ghi đè hoàn toàn mảng mới tinh nhận từ API, không dùng cộng dồn mảng cũ nữa!
        setProducts(productRes.data.data);
      }

    } catch (error) {
      console.error('Lỗi đồng bộ API trên Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const warningPondsCount = ponds.filter(p => p.ten_ao.toLowerCase().includes('04') || p.ten_ao.toLowerCase().includes('cảnh báo')).length;

  if (loading) return <div className="ponds-loading">Đang tải bảng điều khiển nông trại...</div>;

  return (
    <div className="dashboard-container">
      
      {/* KHỐI 1: BANNER CHÀO MỪNG */}
      <div className="welcome-banner">
        <h1>Chào ông {userName},</h1>
        <div className="system-status">
          <span className="status-dot"></span>
          Hệ thống vận hành ổn định • Cập nhật vừa xong
        </div>
      </div>

      {/* KHỐI 2: WIDGETS THỐNG KÊ TỔNG QUAN */}
      <div className="widgets-grid">
        <div className="widget-card">
          <div className="widget-info">
            <span>Tổng số ao nuôi</span>
            <h2>{ponds.length < 10 ? `0${ponds.length}` : ponds.length} <small>Ao</small></h2>
          </div>
          <div className="widget-icon-box" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <i className="fa-solid fa-droplet"></i>
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-info">
            <span>Tổng hạn mức công nợ</span>
            <h2>
              {totalDebt >= 1000000000 
                ? `${(totalDebt / 1000000000).toFixed(3)} tỷ` 
                : totalDebt >= 1000000 
                ? `${(totalDebt / 1000000).toFixed(1)} tr đ` 
                : `${Number(totalDebt).toLocaleString()}đ`}
            </h2>
          </div>
          <div className="widget-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <i className="fa-solid fa-wallet"></i>
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-info">
            <span>Ao cần chú ý</span>
            <h2>{warningPondsCount < 10 ? `0${warningPondsCount}` : warningPondsCount} <small>Ao</small></h2>
          </div>
          <div className="widget-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <i className="fa-solid fa-chart-line"></i>
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-info">
            <span>Đơn hàng mới</span>
            <h2>{newOrdersCount < 10 ? `0${newOrdersCount}` : newOrdersCount} <small>Đơn</small></h2>
          </div>
          <div className="widget-icon-box" style={{ background: '#fdf6b2', color: '#7e22ce' }}>
            <i className="fa-solid fa-basket-shopping"></i>
          </div>
        </div>
      </div>

      {/* KHỐI 3: BỐ CỤC KHU VỰC TRUNG TÂM */}
      <div className="main-dashboard-layout">
        <div>
          <div className="section-header">
            <h3><i className="fa-solid fa-grip" style={{color: '#0284c7'}}></i> Quản lý Ao nuôi</h3>
            <span onClick={() => navigate('/ponds')} className="btn-view-all">Xem tất cả</span>
          </div>

          <div className="home-ponds-grid">
            {ponds.slice(0, 4).map((pond) => {
              const pondCrop = allCropSeasons.find(c => c.id_ao === pond.id_ao && c.trang_thai === 'dang_nuoi');
              return (
                <HomePondCard 
                  key={pond.id_ao} 
                  pond={pond} 
                  activeCrop={pondCrop}
                  onActionClick={() => navigate('/ponds')}
                />
              );
            })}
          </div>
        </div>

        <aside className="aside-widgets-stack">
          <div className="quick-tools-box">
            <h4><i className="fa-regular fa-compass"></i> Tiện ích nhanh</h4>
            <div className="tools-buttons-list">
              <button onClick={() => navigate('/store')} className="btn-tool-link">
                <i className="fa-solid fa-cart-shopping"></i> Mua vật tư trả sau
              </button>
              <button onClick={() => navigate('/ponds')} className="btn-tool-link">
                <i className="fa-regular fa-clipboard"></i> Ghi nhật ký nuôi
              </button>
            </div>
          </div>

          {/* COMPONENT THỜI TIẾT TỰ ĐỘNG THEO ĐỊA CHỈ AO */}
          <HomeWeatherCard firstPondAddress={ponds[0]?.dia_chi_ao} />
        </aside>
      </div>

      {/* COMPONENT HIỂN THỊ 4 SẢN PHẨM MỚI NHẤT DƯỚI ĐÁY TRANG */}
      <HomeProductsSection products={products} />

    </div>
  );
};

export default DashboardPage;