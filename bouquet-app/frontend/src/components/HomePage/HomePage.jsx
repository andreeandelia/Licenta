import "./HomePage.css";
import HeroSection from "../HeroSection/HeroSection";
import Navbar from "../Navbar/Navbar";
import SaleCode from "../SaleCode/SaleCode";
import ShopByCategory from "../ShopByCategory/ShopByCategory";
import WhyBloomery from "../WhyBloomery/WhyBloomery";
import CTASection from "../CTASection/CTASection";
import Footer from "../Footer/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SaleCode />
        <ShopByCategory />
        <WhyBloomery />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
