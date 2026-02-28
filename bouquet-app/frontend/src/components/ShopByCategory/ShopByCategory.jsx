import "./ShopByCategory.css";
import flowersImg from "../../assets/flowers.jpg";
import wrappingImg from "../../assets/wrapping.jpg";
import accessoriesImg from "../../assets/accessories.jpg";
import { Link } from "react-router-dom";

const categories = [
  {
    title: "Fresh Flowers",
    subtitle: "Premium roses, tulips, and more",
    image: flowersImg,
    to: "/builder?category=flowers",
  },
  {
    title: "Elegant Wrapping",
    subtitle: "Beautiful papers, ribbons, and wrapping options",
    image: wrappingImg,
    to: "/builder?category=wrapping",
  },
  {
    title: "Accessories",
    subtitle: "Cards, ribbons, vases, and special touches",
    image: accessoriesImg,
    to: "/builder?category=accessories",
  },
];

export default function ShopByCategory() {
  return (
    <section className="cat">
      <div className="cat-content">
        <h2 className="cat-title">Shop by Category</h2>
        <p className="cat-subtitle">
          Everything you need to create the perfect bouquet
        </p>

        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.title} to={c.to} className="cat-card">
              <div className="cat-imageWrap">
                <img src={c.image} alt={c.title} className="cat-image" />
              </div>

              <div className="cat-body">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
