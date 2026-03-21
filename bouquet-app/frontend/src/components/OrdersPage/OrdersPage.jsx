import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Orders from "../Orders/Orders";

export default function OrdersPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <Orders />
      </main>
      <Footer />
    </div>
  );
}
