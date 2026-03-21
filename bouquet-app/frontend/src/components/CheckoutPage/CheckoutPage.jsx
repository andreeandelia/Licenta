import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Checkout from "../Checkout/Checkout";

export default function CheckoutPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <Checkout />
      </main>
      <Footer />
    </div>
  );
}
