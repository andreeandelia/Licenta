import "./Navbar.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../stores/actions/auth-actions";

export default function Navbar({ cartCount = 0 }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function handleLogout() {
    setOpen(false);
    dispatch(logout());
  }

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
          {/*Cart*/}
          <Link to="/cart" className="icon-btn" aria-label="Cart">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>

          {!user ? (
            <>
              {/*Login*/}
              <Link to="/auth" className="login-btn">
                Login
              </Link>
            </>
          ) : (
            <>
              {/*User dropdown*/}
              <div className="menu" ref={menuRef}>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                >
                  <User size={18} />
                </button>

                {open && (
                  <div className="dropdown" role="menu">
                    <div className="dropdown-head">
                      <div className="dropdown-name">{user.name || "User"}</div>
                    </div>

                    <div className="dropdown-sep" />

                    <Link
                      to="/orders"
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/settings"
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      Settings
                    </Link>

                    <div className="dropdown-sep" />

                    <button
                      className="dropdown-item danger"
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
