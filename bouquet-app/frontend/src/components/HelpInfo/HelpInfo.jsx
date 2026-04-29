import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CircleHelp,
  ChevronDown,
  ChevronUp,
  Truck,
  Clock3,
  RotateCcw,
  Flower2,
  FileText,
} from "lucide-react";
import "./HelpInfo.css";

const FAQ_ITEMS = [
  {
    question: "How do I place an order?",
    answer:
      "You can place an order by using the Bouquet Builder to create a custom arrangement. Add items to your cart and proceed to checkout.",
  },
  {
    question: "Can I customize my bouquet?",
    answer:
      "Yes. Use our Bouquet Builder to choose flowers, wrapping, and accessories, then add your custom bouquet to cart.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept cash on delivery and online payments.",
  },
  {
    question: "Do you offer same-day delivery?",
    answer:
      "Yes, for orders confirmed before 14:00, subject to stock and courier availability.",
  },
  {
    question: "How do I track my order?",
    answer:
      "You receive status updates by email, and our support team can also help with live status details.",
  },
  {
    question: "Can I schedule a delivery for a future date?",
    answer:
      "Yes, you can choose a preferred date and time slot during checkout, up to 2 weeks in advance.",
  },
  {
    question: "What if I need to cancel or modify my order?",
    answer:
      "Please contact support as soon as possible. Changes are possible until bouquet preparation starts.",
  },
];

const CHAPTER_LINKS = [
  { id: "faq", label: "FAQ" },
  { id: "delivery", label: "Delivery Information" },
  { id: "returns", label: "Returns & Refunds" },
  { id: "care", label: "Care Instructions" },
  { id: "terms", label: "Terms & Conditions" },
];

function SectionHead({ icon, title, subtitle, tone }) {
  return (
    <div className="help-section-head">
      <span className={`help-section-icon ${tone}`}>{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export default function HelpInfo() {
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(0);

  const chapterSet = useMemo(
    () => new Set(CHAPTER_LINKS.map((chapter) => chapter.id)),
    [],
  );

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const anchorId = location.hash.replace("#", "");
    const anchorElement = chapterSet.has(anchorId)
      ? document.getElementById(anchorId)
      : null;
    if (anchorElement) {
      anchorElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, chapterSet]);

  return (
    <div className="help-page">
      <section className="help-wrap">
        <div className="help-head">
          <h1>Help &amp; Info</h1>
          <p>
            Everything you need to know about delivery, bouquet care, and order
            support.
          </p>
        </div>

        <div className="help-nav">
          {CHAPTER_LINKS.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="help-nav-link"
            >
              {chapter.label}
            </a>
          ))}
        </div>

        <div className="help-list">
          <article id="faq" className="help-card">
            <SectionHead
              icon={<CircleHelp size={18} />}
              title="Frequently Asked Questions"
              subtitle="Quick answers to common questions"
              tone="pink"
            />

            <div className="faq-list">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={item.question}
                    className={`faq-item ${isOpen ? "open" : ""}`}
                  >
                    <button
                      className="faq-trigger"
                      type="button"
                      onClick={() =>
                        setOpenFaq((prev) => (prev === index ? -1 : index))
                      }
                    >
                      <span>{item.question}</span>
                      {isOpen ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </button>

                    {isOpen && <div className="faq-answer">{item.answer}</div>}
                  </div>
                );
              })}
            </div>
          </article>

          <article id="delivery" className="help-card">
            <SectionHead
              icon={<Truck size={18} />}
              title="Shipping & Delivery"
              subtitle="Delivery options and timelines"
              tone="purple"
            />

            <h3>Delivery Areas</h3>
            <p className="help-text">
              We currently deliver to Bucharest and surrounding regions. Please
              enter your postal code at checkout to confirm delivery
              availability.
            </p>

            <div className="help-divider" />

            <h3>Delivery Times</h3>
            <div className="delivery-cards">
              <div className="delivery-row pink">
                <Clock3 size={18} />
                <div>
                  <strong>Same-Day Delivery</strong>
                  <p>
                    Order before 14:00 for same-day delivery (subject to
                    availability)
                  </p>
                </div>
              </div>
              <div className="delivery-row purple">
                <Clock3 size={18} />
                <div>
                  <strong>Scheduled Delivery</strong>
                  <p>
                    Choose your preferred date and time slot up to 2 weeks in
                    advance
                  </p>
                </div>
              </div>
              <div className="delivery-row green">
                <Clock3 size={18} />
                <div>
                  <strong>Express Delivery</strong>
                  <p>
                    2-4 hour delivery available for urgent orders (additional
                    fee applies)
                  </p>
                </div>
              </div>
            </div>

            <div className="help-divider" />

            <h3>Delivery Fees</h3>
            <ul className="dot-list">
              <li>Free delivery on orders over RON 50</li>
              <li>Standard delivery (next-day): RON 24.99</li>
              <li>Same-day delivery: RON 34.99</li>
              <li>Express delivery (2-4 hours): RON 49.99</li>
            </ul>
          </article>

          <article id="returns" className="help-card">
            <SectionHead
              icon={<RotateCcw size={18} />}
              title="Returns & Refunds"
              subtitle="Our satisfaction guarantee policy"
              tone="blue"
            />

            <h3>Freshness Guarantee</h3>
            <p className="help-text">
              We guarantee the freshness and quality of all our flowers. If you
              are not completely satisfied with your order, please contact us
              within 24 hours of delivery with photos of the issue.
            </p>

            <div className="help-divider" />

            <h3>Refund Policy</h3>
            <ul className="dot-list">
              <li>Full refund if flowers arrive damaged or wilted</li>
              <li>Replacement bouquet or monetary refund available</li>
              <li>Refunds processed within 3-5 business days</li>
              <li>
                Cancellations must be made at least 2 hours before scheduled
                delivery
              </li>
            </ul>

            <div className="help-divider" />

            <h3>How to Request a Refund</h3>
            <ol className="number-list">
              <li>Contact customer support via email or phone</li>
              <li>Provide your order number and photos of the issue</li>
              <li>Our team will review your request within 24 hours</li>
              <li>Choose between refund or replacement</li>
            </ol>
          </article>

          <article id="care" className="help-card">
            <SectionHead
              icon={<Flower2 size={18} />}
              title="Flower Care Instructions"
              subtitle="Keep your blooms fresh and beautiful"
              tone="green"
            />

            <h3>When You Receive Your Bouquet</h3>

            <div className="care-steps">
              <div className="care-step">
                <span>1</span>
                <div>
                  <strong>Unwrap carefully</strong>
                  <p>
                    Remove the bouquet from packaging and any protective
                    wrapping
                  </p>
                </div>
              </div>
              <div className="care-step">
                <span>2</span>
                <div>
                  <strong>Trim the stems</strong>
                  <p>Cut stems at a 45-degree angle, removing 1-2 inches</p>
                </div>
              </div>
              <div className="care-step">
                <span>3</span>
                <div>
                  <strong>Prepare the vase</strong>
                  <p>
                    Fill with fresh, cool water and add flower food if provided
                  </p>
                </div>
              </div>
              <div className="care-step">
                <span>4</span>
                <div>
                  <strong>Remove lower leaves</strong>
                  <p>Strip any leaves that will be below the waterline</p>
                </div>
              </div>
            </div>

            <div className="help-divider" />

            <h3>Daily Care Tips</h3>
            <ul className="dot-list">
              <li>Change water every 2-3 days</li>
              <li>Keep bouquet away from direct sunlight and heat sources</li>
              <li>Remove any wilted flowers to help others last longer</li>
              <li>Re-cut stems every few days to maintain water absorption</li>
              <li>Display in a cool area (18-22°C is ideal)</li>
            </ul>

            <div className="pro-tip">
              <strong>💡 Pro Tip:</strong> Adding a small amount of sugar or
              lemon juice to the water can help extend the life of your flowers.
            </div>
          </article>

          <article id="terms" className="help-card">
            <SectionHead
              icon={<FileText size={18} />}
              title="Terms & Conditions"
              subtitle="Please read these terms carefully"
              tone="slate"
            />

            <h3>Acceptance of Terms</h3>
            <p className="help-text">
              By accessing and using Bloomery's services, you accept and agree
              to be bound by these Terms and Conditions. If you do not agree to
              these terms, please do not use our services.
            </p>

            <div className="help-divider" />

            <h3>Product Information</h3>
            <ul className="dot-list">
              <li>
                Flowers are natural products and may vary slightly from images
                shown
              </li>
              <li>
                We reserve the right to substitute flowers of equal or greater
                value if necessary
              </li>
              <li>Seasonal availability may affect product selection</li>
            </ul>

            <div className="help-divider" />

            <h3>Orders and Payment</h3>
            <ul className="dot-list">
              <li>
                All prices are in RON and subject to change without notice
              </li>
              <li>
                Payment is collected at delivery for cash on delivery orders and
                online at checkout for online payments
              </li>
              <li>We reserve the right to refuse or cancel any order</li>
            </ul>

            <div className="help-divider" />

            <h3>Delivery</h3>
            <ul className="dot-list">
              <li>Delivery times are estimates and not guaranteed</li>
              <li>
                We are not responsible for delays caused by weather or
                circumstances beyond our control
              </li>
              <li>Incorrect delivery details may result in additional fees</li>
            </ul>

            <div className="help-divider" />

            <h3>Liability</h3>
            <p className="help-text">
              Bloomery is not liable for any indirect, incidental, special, or
              consequential damages arising from the use of our services or
              products. Our liability is limited to the amount paid for the
              order in question.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
