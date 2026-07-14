import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  MapPinned,
  Package,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  customerProfileService,
  type CustomerDebtProfile,
} from "../../services/customerProfile.service";
import {
  limitProposalService,
  type LimitProposal,
} from "../../services/limitProposal.service";
import {
  debtExtensionService,
  type DebtExtension,
} from "../../services/debtExtension.service";
import { orderService, type OrderRecord } from "../../services/order.service";
import {
  adminDeliveryService,
  type AdminDelivery,
} from "../../services/adminDelivery.service";
import "./AdminCommon.css";

interface DashboardState {
  profiles: CustomerDebtProfile[];
  proposals: LimitProposal[];
  debtExtensions: DebtExtension[];
  orders: OrderRecord[];
  deliveries: AdminDelivery[];
}

type DashboardKey = keyof DashboardState;

const emptyDashboardState: DashboardState = {
  profiles: [],
  proposals: [],
  debtExtensions: [],
  orders: [],
  deliveries: [],
};

const getArrayData = <T,>(payload: unknown): T[] => {
  const response = payload as {
    data?: T[] | { items?: T[] };
    items?: T[];
  };

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(payload)) return payload as T[];

  return [];
};

const formatCount = (value: number) => value.toLocaleString("vi-VN");

const quickActions = [
  {
    label: "Quản lý đơn hàng",
    description: "Xem đơn mới, trạng thái thanh toán và giao hàng.",
    href: "/admin/don-hang",
    icon: ReceiptText,
  },
  {
    label: "Sản phẩm & tồn kho",
    description: "Cập nhật sản phẩm, tồn kho theo kho kinh doanh.",
    href: "/admin/san-pham",
    icon: Package,
  },
  {
    label: "Khu vực vận chuyển",
    description: "Cấu hình tỉnh phục vụ, điểm xuất phát và mức phí.",
    href: "/admin/khu-vuc-van-chuyen",
    icon: MapPinned,
  },
  {
    label: "Người dùng",
    description: "Quản lý tài khoản khách hàng và nhân viên.",
    href: "/admin/nguoi-dung",
    icon: Users,
  },
];

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardState>(emptyDashboardState);
  const [loading, setLoading] = useState(false);
  const [failedKeys, setFailedKeys] = useState<DashboardKey[]>([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setFailedKeys([]);

      const results = await Promise.allSettled([
        customerProfileService.getAllCustomerProfiles(),
        limitProposalService.getAllProposals(),
        debtExtensionService.getAllDebtExtensions(),
        orderService.getAdminOrders(),
        adminDeliveryService.getAllDeliveries(),
      ]);

      const keys: DashboardKey[] = [
        "profiles",
        "proposals",
        "debtExtensions",
        "orders",
        "deliveries",
      ];

      const nextState: DashboardState = { ...emptyDashboardState };
      const nextFailedKeys: DashboardKey[] = [];

      results.forEach((result, index) => {
        const key = keys[index];

        if (result.status === "fulfilled") {
          if (key === "profiles") {
            nextState.profiles = getArrayData<CustomerDebtProfile>(result.value);
          }

          if (key === "proposals") {
            nextState.proposals = getArrayData<LimitProposal>(result.value);
          }

          if (key === "debtExtensions") {
            nextState.debtExtensions = getArrayData<DebtExtension>(result.value);
          }

          if (key === "orders") {
            nextState.orders = getArrayData<OrderRecord>(result.value);
          }

          if (key === "deliveries") {
            nextState.deliveries = getArrayData<AdminDelivery>(result.value);
          }
        } else {
          nextFailedKeys.push(key);
        }
      });

      setDashboard(nextState);
      setFailedKeys(nextFailedKeys);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const pendingProfiles = dashboard.profiles.filter((profile) =>
      ["cho_kiem_tra", "cho_de_xuat", "cho_admin_duyet"].includes(
        String(profile.trang_thai_ho_so || "")
      )
    ).length;

    const pendingProposals = dashboard.proposals.filter(
      (proposal) => proposal.trang_thai === "cho_duyet"
    ).length;

    const activeOrders = dashboard.orders.filter((order) =>
      [
        "cho_xac_nhan",
        "cho_giao",
        "dang_giao",
        "da_thanh_toan",
        "cho_thanh_toan",
      ].includes(String(order.trang_thai_don_hang || ""))
    ).length;

    const activeDeliveries = dashboard.deliveries.filter((delivery) =>
      ["cho_giao", "dang_giao"].includes(delivery.trang_thai)
    ).length;

    const pendingDebtExtensions = dashboard.debtExtensions.filter(
      (extension) => extension.trang_thai === "cho_duyet"
    ).length;

    const completedOrders = dashboard.orders.filter((order) =>
      ["hoan_tat", "da_giao", "giao_thanh_cong"].includes(
        String(order.trang_thai_don_hang || "")
      )
    ).length;

    return {
      pendingProfiles,
      pendingProposals,
      activeOrders,
      activeDeliveries,
      pendingDebtExtensions,
      completedOrders,
    };
  }, [dashboard]);

  const overviewCards = [
    {
      label: "Hồ sơ trả sau",
      value: formatCount(metrics.pendingProfiles),
      description: `${formatCount(dashboard.profiles.length)} hồ sơ trong hệ thống.`,
      icon: ClipboardCheck,
      tone: "blue",
    },
    {
      label: "Phiếu hạn mức",
      value: formatCount(metrics.pendingProposals),
      description: `${formatCount(dashboard.proposals.length)} phiếu đề xuất.`,
      icon: WalletCards,
      tone: "teal",
    },
    {
      label: "Đơn hàng",
      value: formatCount(metrics.activeOrders),
      description: `${formatCount(metrics.completedOrders)} đơn đã hoàn tất.`,
      icon: ShoppingCart,
      tone: "amber",
    },
    {
      label: "Giao hàng",
      value: formatCount(metrics.activeDeliveries),
      description: `${formatCount(dashboard.deliveries.length)} phiếu giao hàng.`,
      icon: Truck,
      tone: "green",
    },
  ];

  const pendingItems = [
    {
      title: "Hồ sơ mua trả sau",
      description: `${formatCount(metrics.pendingProfiles)} hồ sơ cần xử lý.`,
      href: "/admin/ho-so-tra-sau",
      icon: ShieldCheck,
    },
    {
      title: "Gia hạn thanh toán",
      description: `${formatCount(metrics.pendingDebtExtensions)} yêu cầu đang chờ duyệt.`,
      href: "/admin/gia-han-thanh-toan",
      icon: CreditCard,
    },
    {
      title: "Thỏa thuận ba bên",
      description: "Theo dõi xác nhận hiệu lực hợp đồng.",
      href: "/admin/thoa-thuan-ba-ben",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="admin-page admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-page__eyebrow">Tổng quan hệ thống</p>
          <h1>Trang quản trị</h1>
          <p>
            Theo dõi vận hành bán vật tư nuôi tôm, mua trả sau, công nợ và giao
            hàng trong một màn hình gọn.
          </p>
        </div>

        <div className="admin-dashboard-hero__status">
          <span>Trạng thái</span>
          <strong>{loading ? "Đang tải dữ liệu" : "Đang vận hành"}</strong>
          <small>
            {failedKeys.length > 0
              ? "Có một vài nhóm dữ liệu chưa tải được."
              : "Số liệu được lấy từ các API quản trị hiện có."}
          </small>
          <button type="button" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </section>

      {failedKeys.length > 0 && (
        <div className="admin-dashboard-alert">
          <AlertCircle size={18} />
          Một số API thống kê chưa phản hồi: {failedKeys.join(", ")}.
        </div>
      )}

      <section className="admin-dashboard-stats">
        {overviewCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              className={`admin-dashboard-stat admin-dashboard-stat--${item.tone}`}
              key={item.label}
            >
              <div className="admin-dashboard-stat__icon">
                <Icon size={22} />
              </div>
              <span>{item.label}</span>
              <strong>{loading ? "..." : item.value}</strong>
              <p>{loading ? "Đang đồng bộ dữ liệu..." : item.description}</p>
            </article>
          );
        })}
      </section>

      <main className="admin-dashboard-layout">
        <section className="admin-dashboard-panel admin-dashboard-panel--wide">
          <div className="admin-dashboard-section-head">
            <div>
              <p className="admin-page__eyebrow">Thao tác nhanh</p>
              <h2>Đi tới module thường dùng</h2>
            </div>
          </div>

          <div className="admin-dashboard-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link className="admin-dashboard-action" to={action.href} key={action.href}>
                  <div>
                    <Icon size={22} />
                  </div>
                  <span>{action.label}</span>
                  <p>{action.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="admin-dashboard-panel">
          <div className="admin-dashboard-section-head">
            <div>
              <p className="admin-page__eyebrow">Cần xử lý</p>
              <h2>Công việc ưu tiên</h2>
            </div>
          </div>

          <div className="admin-dashboard-pending">
            {pendingItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link className="admin-dashboard-pending-item" to={item.href} key={item.href}>
                  <div>
                    <Icon size={18} />
                  </div>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{loading ? "Đang tải dữ liệu..." : item.description}</small>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
