import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "/fonts/RobotoCondensed-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "/fonts/Roboto-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 11,
    lineHeight: 1.45,
    fontFamily: "Roboto",
  },
  center: {
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 18,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: {
    marginBottom: 3,
  },
  bold: {
    fontWeight: "bold",
  },
  clause: {
    marginBottom: 5,
    textAlign: "justify",
  },
  signatureWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 34,
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
  },
  signatureSpace: {
    height: 70,
  },
});

export interface ContractPdfProfile {
  id_ho_so?: number;
  dinh_muc_cong_no?: number | string;
  han_thanh_toan?: string | null;
  ghi_chu?: string | null;
  NguoiDung?: {
    ho_ten?: string;
    email?: string;
    so_dien_thoai?: string;
    dia_chi?: string;
  };
  AoNuoi?: {
    ten_ao?: string;
    dien_tich?: number | string;
    dia_chi_ao?: string;
  };
  VuNuoi?: {
    ten_vu_nuoi?: string;
    ngay_tha_giong?: string;
    ngay_thu_hoach_du_kien?: string;
  };
}

interface Props {
  profile: ContractPdfProfile;
  contractCode: string;
  extraTerms?: string;
}

const formatCurrency = (value?: number | string | null) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function ContractPdfDocument({
  profile,
  contractCode,
  extraTerms,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.center}>CÔNG TY VẬT TƯ NUÔI TÔM LVTN</Text>
        <Text style={styles.center}>Độc lập - Tự do - Hạnh phúc</Text>

        <Text style={styles.title}>Hợp đồng mua bán trả sau</Text>
        <Text style={styles.subtitle}>Số hợp đồng: {contractCode}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin bên bán</Text>
          <Text style={styles.row}>Bên A: Công ty vật tư nuôi tôm LVTN</Text>
          <Text style={styles.row}>Địa chỉ: ....................................................</Text>
          <Text style={styles.row}>Đại diện: ...................................................</Text>
          <Text style={styles.row}>Chức vụ: ....................................................</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Thông tin khách hàng</Text>
          <Text style={styles.row}>
            Bên B: {profile.NguoiDung?.ho_ten || "Chưa có thông tin"}
          </Text>
          <Text style={styles.row}>
            Số điện thoại: {profile.NguoiDung?.so_dien_thoai || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Email: {profile.NguoiDung?.email || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Địa chỉ: {profile.NguoiDung?.dia_chi || "Chưa có"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Thông tin ao nuôi và vụ nuôi</Text>
          <Text style={styles.row}>Hồ sơ mua trả sau: #{profile.id_ho_so}</Text>
          <Text style={styles.row}>
            Ao nuôi: {profile.AoNuoi?.ten_ao || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Diện tích: {profile.AoNuoi?.dien_tich || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Địa chỉ ao: {profile.AoNuoi?.dia_chi_ao || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Vụ nuôi: {profile.VuNuoi?.ten_vu_nuoi || "Chưa có"}
          </Text>
          <Text style={styles.row}>
            Ngày thả giống: {formatDate(profile.VuNuoi?.ngay_tha_giong)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Hạn mức và thời hạn thanh toán</Text>
          <Text style={styles.row}>
            Hạn mức công nợ được duyệt: {formatCurrency(profile.dinh_muc_cong_no)}
          </Text>
          <Text style={styles.row}>
            Hạn thanh toán: {formatDate(profile.han_thanh_toan)}
          </Text>
          <Text style={styles.row}>
            Khách hàng chỉ được mua trả sau trong phạm vi hạn mức đã được doanh nghiệp phê duyệt.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Điều khoản thực hiện</Text>
          <Text style={styles.clause}>
            Bên B cam kết sử dụng vật tư đúng mục đích cho hoạt động nuôi tôm đã đăng ký trong hồ sơ mua trả sau.
          </Text>
          <Text style={styles.clause}>
            Bên B có trách nhiệm thanh toán đầy đủ công nợ phát sinh trong thời hạn thanh toán đã được phê duyệt.
          </Text>
          <Text style={styles.clause}>
            Bên A có quyền tạm dừng cấp hàng trả sau nếu Bên B có dấu hiệu vi phạm nghĩa vụ thanh toán hoặc thông tin hồ sơ không còn chính xác.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Xử lý vi phạm</Text>
          <Text style={styles.clause}>
            Nếu Bên B chậm thanh toán, cung cấp thông tin sai lệch, không hợp tác trong quá trình thu hồi công nợ hoặc sử dụng vật tư sai mục đích, Bên A có quyền tạm khóa quyền mua trả sau, dừng cấp hạn mức mới, yêu cầu thanh toán toàn bộ công nợ còn lại và áp dụng biện pháp quản lý rủi ro phù hợp theo chính sách của doanh nghiệp.
          </Text>
          <Text style={styles.clause}>
            Trường hợp vi phạm nghiêm trọng, Bên A có quyền hủy bỏ quyền mua trả sau và chuyển hồ sơ sang diện quản lý rủi ro cao.
          </Text>
        </View>

        {extraTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Điều khoản bổ sung</Text>
            <Text style={styles.clause}>{extraTerms}</Text>
          </View>
        )}

        <View style={styles.signatureWrap}>
          <View style={styles.signatureBox}>
            <Text style={styles.bold}>ĐẠI DIỆN BÊN A</Text>
            <Text>(Ký và ghi rõ họ tên)</Text>
            <View style={styles.signatureSpace} />
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.bold}>ĐẠI DIỆN BÊN B</Text>
            <Text>(Ký và ghi rõ họ tên)</Text>
            <View style={styles.signatureSpace} />
          </View>
        </View>
      </Page>
    </Document>
  );
}