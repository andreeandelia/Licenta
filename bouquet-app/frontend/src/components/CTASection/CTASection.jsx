import "./CTASection.css";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="cta">
      <div className="cta-content">
        <p className="cta-kicker">Ready to Create Your Perfect Bouquet?</p>
        <h2 className="cta-title">
          Start building now and bring your floral vision to life
        </h2>

        <Link to="/builder" className="cta-button">
          <Sparkles size={18} aria-hidden="true" />
          Start Building Now
        </Link>
      </div>
    </section>
  );
}
