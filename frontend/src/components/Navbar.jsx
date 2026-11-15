
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    const token = localStorage.getItem("token");

    let user = null;

    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch {
        user = null;
    }

    const closeMenus = () => {
        setMenuOpen(false);
        setAccountOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        closeMenus();
        navigate("/login");
    };

    return (
        <header className="site-header">
            <nav className="site-nav">
                <Link
                    to="/"
                    className="nav-brand"
                    onClick={closeMenus}
                >
                    <span className="nav-brand-name">
                        rewear<span>.</span>
                    </span>
                    <small>THE CIRCULAR WARDROBE</small>
                </Link>

                <button
                    className="mobile-menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>

                <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
                    <Link to="/" onClick={closeMenus}>
                        Discover
                    </Link>

                    <Link to="/contact" onClick={closeMenus}>
                        Contact
                    </Link>

                    {token ? (
                        <>
                            <Link
                                to="/create-listing"
                                className="nav-sell-button"
                                onClick={closeMenus}
                            >
                                + Sell an item
                            </Link>

                            <div className="account-menu">
                                <button
                                    className="account-trigger"
                                    onClick={() => setAccountOpen(!accountOpen)}
                                    aria-expanded={accountOpen}
                                >
                                    <span className="account-avatar">
                                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                    <span>My space</span>
                                    <span className="account-chevron">
                                        {accountOpen ? "⌃" : "⌄"}
                                    </span>
                                </button>

                                {accountOpen && (
                                    <div className="account-dropdown">
                                        <div className="account-dropdown-heading">
                                            <strong>{user?.name || "Your account"}</strong>
                                            <span>{user?.email || ""}</span>
                                        </div>

                                        <Link to="/profile" onClick={() => setAccountOpen(false)}>
                                            My Profile
                                        </Link>

                                        <Link to="/my-listings" onClick={closeMenus}>
                                            My listings
                                        </Link>

                                        <Link to="/my-requests" onClick={closeMenus}>
                                            Purchase requests
                                        </Link>

                                        <Link to="/my-offers" onClick={closeMenus}>
                                            My offers
                                        </Link>

                                        <Link to="/my-orders" onClick={closeMenus}>
                                            My orders
                                        </Link>

                                        <div className="dropdown-divider" />

                                        <Link to="/purchase-requests" onClick={closeMenus}>
                                            Buyer requests
                                        </Link>

                                        <Link to="/offers" onClick={closeMenus}>
                                            Offers received
                                        </Link>

                                        <Link to="/received-orders" onClick={closeMenus}>
                                            Orders received
                                        </Link>

                                        <button
                                            className="logout-button"
                                            onClick={handleLogout}
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={closeMenus}>
                                Sign in
                            </Link>

                            <Link
                                to="/register"
                                className="nav-sell-button"
                                onClick={closeMenus}
                            >
                                Join ReWear
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
