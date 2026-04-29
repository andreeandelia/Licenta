import "./Footer.css";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import solOnlineImage from "../../assets/anpc-sol.avif";
import anpcSalImage from "../../assets/anpc-sal.avif";

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
              <Link to="/help-info#delivery">Delivery Information</Link>
            </li>
            <li>
              <Link to="/help-info#faq">FAQ</Link>
            </li>
            <li>
              <Link to="/help-info#care">Care Instructions</Link>
            </li>
            <li>
              <Link to="/help-info#returns">Returns &amp; Refunds</Link>
            </li>
            <li>
              <Link to="/help-info#terms">Terms &amp; Conditions</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <div className="column-title">Contact Us</div>

          <div className="footer-contact">
            <div className="footer-contactRow">
              <Phone size={16} aria-hidden="true" />
              <span>
                <a href="tel:+40123456789">(+40) 123 456 789</a>
              </span>
            </div>

            <div className="footer-contactRow">
              <Mail size={16} aria-hidden="true" />
              <span>
                <a href="mailto:bloomery.app@gmail.com">
                  bloomery.app@gmail.com
                </a>
              </span>
            </div>

            <div className="footer-contactRow">
              <MapPin size={16} aria-hidden="true" />
              <span>
                <a
                  href="https://maps.google.com/?q=123+Flower+St,+Bucharest,+Romania"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  123 Flower St, Bucharest, Romania
                </a>
              </span>
            </div>
          </div>

          <div className="footer-contact-badges">
            <a
              href="https://consumer-redress.ec.europa.eu/site-relocation_en?event=main.home2.show&lng=RO"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Soluționarea online a litigiilor"
            >
              <img
                src={solOnlineImage}
                alt="Soluționarea online a litigiilor"
                className="footer-contact-badge"
              />
            </a>

            <a
              href="https://anpc.ro/ce-este-sal/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Soluționarea alternativă a litigiilor"
            >
              <img
                src={anpcSalImage}
                alt="Soluționarea alternativă a litigiilor"
                className="footer-contact-badge"
              />
            </a>
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
