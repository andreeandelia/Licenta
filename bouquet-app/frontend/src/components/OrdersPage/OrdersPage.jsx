import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Orders from "../Orders/Orders";
import { getSeoMeta, getCanonicalUrl } from "../../utils/seoHelper";

export default function OrdersPage() {
  const meta = getSeoMeta.orders;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={getCanonicalUrl("/orders")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <Orders />
      </main>
      <Footer />
    </div>
  );
}
