import { Helmet } from "react-helmet-async";
import HeroSection from "../HeroSection/HeroSection";
import Navbar from "../Navbar/Navbar";
import SaleCode from "../SaleCode/SaleCode";
import ShopByCategory from "../ShopByCategory/ShopByCategory";
import WhyBloomery from "../WhyBloomery/WhyBloomery";
import CTASection from "../CTASection/CTASection";
import Footer from "../Footer/Footer";
import {
  getSeoMeta,
  getOpenGraphTags,
  getCanonicalUrl,
} from "../../utils/seoHelper";

export default function HomePage() {
  const meta = getSeoMeta.home;
  const og = getOpenGraphTags.home;

  return (
    <div className="page-shell">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="og:title" content={og.ogTitle} />
        <meta name="og:description" content={og.ogDescription} />
        <meta name="og:image" content={og.ogImage} />
        <meta name="og:url" content={og.ogUrl} />
        <meta name="og:type" content="website" />
        <link rel="canonical" href={getCanonicalUrl("/home")} />
      </Helmet>
      <Navbar />
      <main className="page-main">
        <HeroSection />
        <SaleCode />
        <ShopByCategory />
        <WhyBloomery />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
