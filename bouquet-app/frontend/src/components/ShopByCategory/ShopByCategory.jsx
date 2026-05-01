import "./ShopByCategory.css";

const categories = [
  {
    title: "Fresh Flowers",
    subtitle: "Premium roses, tulips, and more",
    image:
      "https://res.cloudinary.com/drhtz5olh/image/upload/q_auto/f_auto/v1777587446/flowers_wvrkzl.jpg",
  },
  {
    title: "Elegant Wrapping",
    subtitle: "Beautiful papers, ribbons, and wrapping options",
    image:
      "https://res.cloudinary.com/drhtz5olh/image/upload/q_auto/f_auto/v1777587712/wrapping_jznxpp.jpg",
  },
  {
    title: "Accessories",
    subtitle: "Cards, ribbons, vases, and special touches",
    image:
      "https://res.cloudinary.com/drhtz5olh/image/upload/q_auto/f_auto/v1777587750/accessories_y2hpm0.jpg",
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
            <div className="cat-card" key={c.title}>
              <div className="cat-imageWrap">
                <img src={c.image} alt={c.title} className="cat-image" />
              </div>

              <div className="cat-body">
                <h3 className="card-title">{c.title}</h3>
                <p className="card-subtitle">{c.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
