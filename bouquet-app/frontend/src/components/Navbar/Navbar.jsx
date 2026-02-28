import "./Navbar.css";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-content">
        <Link to="/home" className="brand" aria-label="Bloomery Home">
          <span className="brand-logo" aria-hidden="true">
            🌸
          </span>
          <span className="brand-name">Bloomery</span>
        </Link>

        <nav className="nav-actions">
          <Link to="/auth" className="login-btn">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
