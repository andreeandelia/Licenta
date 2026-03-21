import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Settings from "../Settings/Settings";

export default function SettingsPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <Settings />
      </main>
      <Footer />
    </div>
  );
}
