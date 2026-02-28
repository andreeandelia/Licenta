import "./HeroSection.css";
import Canvas3D from "../../three/Canvas3D";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-content">
        {/* Left */}
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-icon" aria-hidden="true">
              ✨
            </span>
            <span>AI-Powered Bouquet Suggestions</span>
          </div>

          <h1 className="hero-title">Build Your Own Custom Bouquet</h1>

          <p className="hero-subtitle">
            Choose from premium fresh flowers, elegant wrapping, and beautiful
            accessories. Create something uniquely yours with our intuitive
            bouquet builder.
          </p>

          <div className="hero-actions">
            <Link to="/builder" className="hero-primary">
              Start Building
            </Link>
          </div>
        </div>

        {/* Right */}
        <div className="hero-right" aria-hidden="true">
          <Canvas3D />
        </div>
      </div>
    </section>
  );
}
