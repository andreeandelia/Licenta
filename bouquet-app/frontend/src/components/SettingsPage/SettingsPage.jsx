import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Settings from "../Settings/Settings";
import { getSeoMeta, getCanonicalUrl } from "../../utils/seoHelper";

export default function SettingsPage() {
  const meta = getSeoMeta.settings;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={getCanonicalUrl("/settings")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <Settings />
      </main>
      <Footer />
    </div>
  );
}
