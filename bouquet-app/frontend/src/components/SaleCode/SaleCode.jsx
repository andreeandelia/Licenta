import "./SaleCode.css";
import { Link } from "react-router-dom";

export default function SaleCode() {
  return (
    <section className="sale-code">
      <div className="sale-code-content">
        <h2 className="sale-text">
          🎉 Special Offer: Use code <span className="code">SALE20</span> for
          20% off your order!
        </h2>
        <Link to="/builder" className="sale-btn">
          Shop Now
        </Link>
      </div>
    </section>
  );
}
