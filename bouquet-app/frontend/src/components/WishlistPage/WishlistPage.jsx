import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Wishlist from "../Wishlist/Wishlist";

export default function WishlistPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <Wishlist />
      </main>
      <Footer />
    </div>
  );
}
