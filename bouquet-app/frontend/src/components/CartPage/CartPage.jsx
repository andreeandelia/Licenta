import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Cart from "../Cart/Cart";

export default function CartPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <Cart />
      </main>
      <Footer />
    </div>
  );
}
