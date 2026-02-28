import "./WhyBloomery.css";
import { Sparkles, Heart, Package, Shield } from "lucide-react";

const reasons = [
  {
    title: "AI Suggestions",
    description:
      "Get personalized bouquet recommendations based on your preferences and occasions",
    icon: Sparkles,
  },
  {
    title: "Fresh & Quality",
    description:
      "We source premium fresh flowers and materials to ensure your bouquet looks stunning",
    icon: Heart,
  },
  {
    title: "Fast Delivery",
    description:
      "Enjoy quick and reliable delivery right to your doorstep, perfect for last-minute gifts",
    icon: Package,
  },
  {
    title: "Satisfaction Guaranteed",
    description:
      "If you're not completely satisfied with your bouquet, we'll make it right",
    icon: Shield,
  },
];

export default function WhyBloomery() {
  return (
    <section className="why-bloomery">
      <div className="why-bloomery-content">
        <h2 className="why-bloomery-title">Why Choose Bloomery?</h2>
        <p className="why-bloomery-subtitle">
          The easiest way to create and order custom bouquets
        </p>
      </div>

      <div className="why-bloomery-reasons">
        {reasons.map((r) => (
          <div className="card" key={r.title}>
            <div className="card-body">
              <div className="card-icon">
                <r.icon size={24} aria-hidden="true" />
              </div>
              <h3 className="card-title">{r.title}</h3>
              <p className="card-description">{r.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
