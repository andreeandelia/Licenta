import "./SaleCode.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiUrl } from "../../config/global";

export default function SaleCode() {
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPromo() {
      try {
        const res = await fetch(apiUrl("/api/promos"), {
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(data?.codes) || data.codes.length === 0) {
          if (isMounted) {
            setPromo(null);
          }
          return;
        }

        if (isMounted) {
          setPromo(data.codes[0]);
        }
      } catch {
        if (isMounted) {
          setPromo(null);
        }
      }
    }

    loadPromo();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!promo) {
    return null;
  }

  return (
    <section className="sale-code">
      <div className="sale-code-content">
        <h2 className="sale-text">
          🎉 Special Offer: Use code <span className="code">{promo.code}</span>{" "}
          for {Number(promo.discountPercent || 0)}% off your order!
        </h2>
        <Link to="/builder" className="sale-btn">
          Shop Now
        </Link>
      </div>
    </section>
  );
}
