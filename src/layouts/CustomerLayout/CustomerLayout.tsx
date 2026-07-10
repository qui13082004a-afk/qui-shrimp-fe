import { Outlet } from "react-router-dom";
import Header from "../../components/Header/Header"; 
import Footer from "../../components/Footer/Footer"; // Import file Footer của bạn vào đây
import "./CustomerLayout.css";

const CustomerLayout = () => {
  return (
    <div className="app-container">
      <Header />
      
      <main className="app-content">
        <Outlet />
        
        {/* Gọi component Footer của bạn ở đây, tất cả trang con sẽ tự động có */}
        <Footer />
      </main>
    </div>
  );
};

export default CustomerLayout;