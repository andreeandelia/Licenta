import "./Footer.css";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <section className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-brand-info">
            <span className="footer-brand-logo" aria-hidden="true">
              🌸
            </span>
            <span className="footer-brand-name">Bloomery</span>
          </div>

          <p className="footer-brand-description">
            Create your perfect custom bouquet with our easy-to-use builder and
            AI suggestions.
          </p>
        </div>

        <div className="footer-column">
          <div className="column-title">Quick Links</div>
          <ul className="footer-list">
            <li>
              <Link to="/builder">Build Bouquet</Link>
            </li>
            <li>
              <Link to="/wishlist">Wishlist</Link>
            </li>
            <li>
              <Link to="/orders">Order History</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <div className="column-title">Help &amp; Info</div>
          <ul className="footer-list">
            <li>
              <Link to="/delivery">Delivery Information</Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/care">Care Instructions</Link>
            </li>
            <li>
              <Link to="/returns">Returns &amp; Refunds</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <div className="column-title">Contact Us</div>

          <div className="footer-contact">
            <div className="footer-contactRow">
              <Phone size={16} aria-hidden="true" />
              <span>(+40) 123 456 789</span>
            </div>
            <div className="footer-contactRow">
              <Mail size={16} aria-hidden="true" />
              <span>hello@bloomery.ro</span>
            </div>
            <div className="footer-contactRow">
              <MapPin size={16} aria-hidden="true" />
              <span>123 Flower St, Bucharest, Romania</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-divider" />

      <div className="footer-bottom">
        © {new Date().getFullYear()} Bloomery. All rights reserved.
      </div>
    </section>
  );
}
