import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import Builder from "../Builder/Builder";

export default function BuilderPage() {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-main">
        <Builder />
      </main>
      <Footer />
    </div>
  );
}
