import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import HelpInfo from "../HelpInfo/HelpInfo";

export default function HelpInfoPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <HelpInfo />
      </main>
      <Footer />
    </div>
  );
}
