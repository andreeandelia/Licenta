import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Wishlist from "../Wishlist/Wishlist";
import { getSeoMeta, getCanonicalUrl } from "../../utils/seoHelper";

export default function WishlistPage() {
  const meta = getSeoMeta.wishlist;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={getCanonicalUrl("/wishlist")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <Wishlist />
      </main>
      <Footer />
    </div>
  );
}
