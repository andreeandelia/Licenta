import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Checkout from "../Checkout/Checkout";
import { getSeoMeta, getCanonicalUrl } from "../../utils/seoHelper";

export default function CheckoutPage() {
  const meta = getSeoMeta.checkout;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={getCanonicalUrl("/checkout")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <Checkout />
      </main>
      <Footer />
    </div>
  );
}
