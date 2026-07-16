import { Route, Routes, Navigate } from "react-router-dom";

import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import VerifyEmailPage from "../pages/VerifyEmail/VerifyEmailPage";
import ForgotPasswordPage from "../pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordCodePage from "../pages/ResetPasswordCode/ResetPasswordCodePage";
import ResetNewPasswordPage from "../pages/ResetNewPassword/ResetNewPasswordPage";
import HomePage from "../pages/Home/HomePage";

import CartPage from "../pages/Customer/Cart/CartPage";
import CheckoutPage from "../pages/Customer/Checkout/CheckoutPage";
import PaymentResultPage from "../pages/Customer/PaymentSuccess/PaymentResultPage";
import PaymentSuccessPage from "../pages/Customer/PaymentSuccess/PaymentSuccessPage";
import StorePage from "../pages/Customer/Store/StorePage";
import ProductDetailPage from "../pages/Customer/ProductDetail/ProductDetailPage";
import PondsPage from "../pages/Customer/Ponds/PondsPage";
import DashboardPage from "../pages/Customer/Dashboard/DashboardPage";
import CustomerHomePage from "../pages/Customer/Home/CustomerHomePage";
import AboutPage from "../pages/Customer/About/AboutPage";
import ContactPage from "../pages/Customer/Contact/ContactPage";
import ProfilePage from "../pages/Customer/Profile/ProfilePage";


import CustomerLayout from "../layouts/CustomerLayout/CustomerLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";
import StaffLimitLayout from "../layouts/StaffLimitLayout/StaffLimitLayout";

import DebtPage from "../pages/Customer/Debt/DebtPage";
import DebtDetailPage from "../pages/Customer/Debt/DebtDetailPage";
import OrderSuccessPage from "../pages/Customer/PaymentSuccess/OrderSuccessPage";
import OrderPage from "../pages/Customer/Order/OrderPage";
import OrderDetailPage from "../pages/Customer/Order/OrderDetailPage";
import DebtExtensionRequestPage from "../pages/Customer/DebtExtensionRequestPage/DebtExtensionRequestPage";
import DebtHistoryPage from "../pages/Customer/Debt/DebtHistoryPage";
import SeasonOrderHistoryPage from "../pages/Customer/Ponds/SeasonOrderHistoryPage";
import NotificationsPage from "../pages/Customer/notifications/NotificationsPage";
import DeliveryDashboardPage from "../pages/Delivery/DeliveryDashboardPage";
import DeliveryOrdersPage from "../pages/Delivery/DeliveryOrdersPage";
import DeliveryOrderDetailPage from "../pages/Delivery/DeliveryOrderDetailPage";

import AdminDashboardPage from "../pages/Admin/AdminDashboardPage";
import AdminCreditPolicyPage from "../pages/Admin/AdminCreditPolicyPage";
import AdminLimitProposalPage from "../pages/Admin/AdminLimitProposalPage";
import AdminCustomerDebtProfilePage from "../pages/Admin/AdminCustomerDebtProfilePage";
import AdminDebtExtensionPage from "../pages/Admin/AdminDebtExtensionPage";
import AdminContractPage from "../pages/Admin/AdminContractPage";
import AdminMerchantPage from "../pages/Admin/AdminMerchantPage";
import AdminUserManagementPage from "../pages/Admin/AdminUserManagementPage";
import AdminDeliveryPage from "../pages/Admin/AdminDeliveryPage";
import AdminShippingConfigPage from "../pages/Admin/AdminShippingConfigPage";
import AdminCategoryPage from "../pages/Admin/AdminCategoryPage";
import AdminProductPage from "../pages/Admin/AdminProductPage";
import AdminOrderPage from "../pages/Admin/AdminOrderPage";
import AdminLimitStaffAreaPage from "../pages/Admin/AdminLimitStaffAreaPage";

import StaffAssessmentProfilePage from "../pages/StaffLimit/StaffAssessmentProfilePage";
import StaffLimitProposalPage from "../pages/StaffLimit/StaffLimitProposalPage";
import StaffCreateLimitProposalPage from "../pages/StaffLimit/StaffCreateLimitProposalPage";
import StaffContractPage from "../layouts/StaffLimitLayout/StaffContractPage";

type RoleRouteProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const token = localStorage.getItem("accessToken");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);

    if (!allowedRoles.includes(user.vai_tro)) {
      if (user.vai_tro === "admin") {
        return <Navigate to="/admin" replace />;
      }

      if (user.vai_tro === "nhan_vien_dinh_muc") {
        return <Navigate to="/nhan-vien-dinh-muc/ho-so-tham-dinh" replace />;
      }

      if (user.vai_tro === "nhan_vien_giao_hang") {
        return <Navigate to="/delivery" replace />;
      }

      return <Navigate to="/home" replace />;
    }

    return children;
  } catch {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password-code" element={<ResetPasswordCodePage />} />
      <Route path="/reset-new-password" element={<ResetNewPasswordPage />} />

      <Route element={<CustomerLayout />}>
        <Route path="/home" element={<CustomerHomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/debt" element={<DebtPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/debt/profile/:profileId" element={<DebtDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/debt/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/debt/payment-cancel" element={<PaymentResultPage />} />
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/ponds" element={<PondsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        <Route
          path="/debt-extension/:id"
          element={<DebtExtensionRequestPage />}
        />

        <Route path="/debt/history" element={<DebtHistoryPage />} />

        <Route
          path="/ponds/crop-seasons/:id_vu_nuoi/orders"
          element={<SeasonOrderHistoryPage />}
        />

        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />

        <Route path="chinh-sach-han-muc" element={<AdminCreditPolicyPage />} />
        <Route path="ho-so-cong-no" element={<AdminCustomerDebtProfilePage />} />
        <Route path="ho-so-tra-sau" element={<AdminCustomerDebtProfilePage />} />
        <Route path="phieu-de-xuat-han-muc" element={<AdminLimitProposalPage />} />
        <Route path="gia-han-thanh-toan" element={<AdminDebtExtensionPage />} />
        <Route path="hop-dong" element={<AdminContractPage />} />
        <Route path="thuong-lai" element={<AdminMerchantPage />} />

        <Route path="nguoi-dung" element={<AdminUserManagementPage />} />
        <Route path="nhan-vien-giao-hang" element={<AdminDeliveryPage />} />
        <Route path="nhan-vien-dinh-muc" element={<AdminLimitStaffAreaPage />} />

        <Route path="danh-muc" element={<AdminCategoryPage />} />
        <Route path="san-pham" element={<AdminProductPage />} />
        <Route path="don-hang" element={<AdminOrderPage />} />
        <Route path="giao-hang" element={<AdminDeliveryPage />} />
        <Route path="khu-vuc-van-chuyen" element={<AdminShippingConfigPage />} />

        <Route path="thong-bao" element={<NotificationsPage />} />
      </Route>

      <Route
        path="/nhan-vien-dinh-muc"
        element={
          <RoleRoute allowedRoles={["nhan_vien_dinh_muc"]}>
            <StaffLimitLayout />
          </RoleRoute>
        }
      >
        <Route
  path="tao-phieu-de-xuat"
  element={<StaffCreateLimitProposalPage />}
/>
        <Route index element={<StaffAssessmentProfilePage />} />
        <Route path="ho-so-tham-dinh" element={<StaffAssessmentProfilePage />} />
        <Route path="phieu-de-xuat" element={<StaffLimitProposalPage />} />
           <Route path="hop-dong" element={<StaffContractPage />} />
        <Route path="thong-bao" element={<NotificationsPage />} />
      </Route>

      <Route
        path="/delivery"
        element={
          <RoleRoute allowedRoles={["nhan_vien_giao_hang"]}>
            <DeliveryDashboardPage />
          </RoleRoute>
        }
      />
      <Route
        path="/delivery/orders"
        element={
          <RoleRoute allowedRoles={["nhan_vien_giao_hang"]}>
            <DeliveryOrdersPage />
          </RoleRoute>
        }
      />
      <Route
        path="/delivery/orders/:id"
        element={
          <RoleRoute allowedRoles={["nhan_vien_giao_hang"]}>
            <DeliveryOrderDetailPage />
          </RoleRoute>
        }
      />
      <Route
        path="/delivery/history"
        element={
          <RoleRoute allowedRoles={["nhan_vien_giao_hang"]}>
            <DeliveryOrdersPage />
          </RoleRoute>
        }
      />
      <Route
        path="/delivery/notifications"
        element={
          <RoleRoute allowedRoles={["nhan_vien_giao_hang"]}>
            <NotificationsPage />
          </RoleRoute>
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
