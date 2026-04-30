import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Cart from "../Cart/Cart";
import { getSeoMeta, getCanonicalUrl } from "../../utils/seoHelper";

export default function CartPage() {
  const meta = getSeoMeta.cart;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="og:type" content="website" />
        <link rel="canonical" href={getCanonicalUrl("/cart")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <Cart />
      </main>
      <Footer />
    </div>
  );
}
