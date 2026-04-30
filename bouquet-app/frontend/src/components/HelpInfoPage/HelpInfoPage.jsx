import { Helmet } from "react-helmet-async";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import HelpInfo from "../HelpInfo/HelpInfo";
import { getSeoMeta, getCanonicalUrl } from "../../utils/seoHelper";

export default function HelpInfoPage() {
  const meta = getSeoMeta.help;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <link rel="canonical" href={getCanonicalUrl("/help-info")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <HelpInfo />
      </main>
      <Footer />
    </div>
  );
}
