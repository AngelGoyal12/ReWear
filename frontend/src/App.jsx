import "./App.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import ProductCard from "./components/ProductCard";
import ProductDetails from "./pages/ProductDetails";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import PurchaseRequests from "./pages/PurchaseRequests";
import MyRequests from "./pages/MyRequests";
import Offers from "./pages/Offers";
import MyOffers from "./pages/MyOffers";
import ScrollReveal from "./components/ScrollReveal";
import Contact from "./pages/Contact";
import Footer from "./components/Footer";
import HomeOrbit from "./components/HomeOrbit";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import MyOrders from "./pages/MyOrders";
import ReceivedOrders from "./pages/ReceivedOrders";
import OrderDetails from "./pages/OrderDetails";

import Payment from "./pages/Payment";
import { ToastProvider } from "./context/ToastContext";
import API_BASE_URL from "./utils/api";

function App() {
    const location = useLocation();

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [sort, setSort] = useState("newest");

    useEffect(() => {

        fetch(`${API_BASE_URL}/api/products`)
            .then((response) => response.json())
            .then((data) => {
                setProducts(data);
            })
            .catch((error) => {
                console.error(
                    "Error fetching products:",
                    error
                );
            });

    }, []);


    const filteredProducts = products
        .filter((product) => {

            const matchesSearch =
                product.title
                    .toLowerCase()
                    .includes(search.toLowerCase());

            const matchesCategory =
                category === "All" ||
                product.category === category;

            return (
                matchesSearch &&
                matchesCategory
            );

        })
        .sort((a, b) => {

            if (sort === "low-high") {
                return (
                    Number(a.price) -
                    Number(b.price)
                );
            }

            if (sort === "high-low") {
                return (
                    Number(b.price) -
                    Number(a.price)
                );
            }

            return (
                new Date(b.created_at) -
                new Date(a.created_at)
            );

        });


    return (
        <ToastProvider>
            <>
                <Navbar />
                <div key={location.pathname} className="page-transition">
                    <Routes location={location}>

                        {/* =========================
                    HOME / MARKETPLACE
                ========================= */}

                        <Route
                            path="/"
                            element={
                                <div>

                                    {/* HERO */}

                                    <section className="hero-section">

                                        <div className="hero-content">

                                            <p className="hero-small-text">
                                                THE SECOND LIFE OF CLOTHES
                                            </p>

                                            <h1>
                                                Give clothes
                                                <br />
                                                <span>
                                                    a second life.
                                                </span>
                                            </h1>

                                            <p className="hero-description">
                                                Discover pre-loved fashion,
                                                sell what you no longer wear,
                                                and keep good clothes moving.
                                            </p>

                                            <a
                                                href="#marketplace"
                                                className="hero-button"
                                            >
                                                Explore Marketplace →
                                            </a>

                                        </div>


                                        {/* HERO DECORATION */}

                                        <div className="hero-decoration">
                                            <HomeOrbit
                                                onSelectCategory={(selectedCategory) => {
                                                    setCategory(selectedCategory);

                                                    document.getElementById("marketplace")?.scrollIntoView({
                                                        behavior: "smooth"
                                                    });
                                                }}
                                            />
                                        </div>

                                    </section>

                                    <div className="marquee">

                                        <div className="marquee-track">

                                            <span>PRE-LOVED</span>
                                            <b>✦</b>

                                            <span>RESELL</span>
                                            <b>✦</b>

                                            <span>REWEAR</span>
                                            <b>✦</b>

                                            <span>REPEAT</span>
                                            <b>✦</b>

                                            <span>PRE-LOVED</span>
                                            <b>✦</b>

                                            <span>RESELL</span>
                                            <b>✦</b>

                                            <span>REWEAR</span>
                                            <b>✦</b>

                                            <span>REPEAT</span>
                                            <b>✦</b>

                                        </div>

                                    </div>


                                    {/* =========================
                                MARKETPLACE
                            ========================= */}

                                    <section
                                        id="marketplace"
                                        className="marketplace-section"
                                    >

                                        {/* MARKETPLACE HEADING */}
                                        <ScrollReveal direction="up">

                                            <div className="marketplace-heading">

                                                <p>EXPLORE THE COLLECTION</p>

                                                <h2>
                                                    Pre-loved,
                                                    <br />
                                                    not forgotten.
                                                </h2>

                                                <span>
                                                    Find something worth wearing again.
                                                </span>

                                            </div>
                                        </ScrollReveal>


                                        {/* SEARCH + FILTERS */}
                                        <ScrollReveal direction="up" delay={100}>


                                            <div className="marketplace-controls">
                                                <div className="search-box">
                                                    <span className="search-icon">⌕</span>

                                                    <input
                                                        type="text"
                                                        placeholder="Search for something you love..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                    />

                                                    {search && (
                                                        <button
                                                            type="button"
                                                            className="clear-search"
                                                            onClick={() => setSearch("")}
                                                            aria-label="Clear search"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="filter-group">
                                                    <label className="filter-select">
                                                        <span>CATEGORY</span>
                                                        <select
                                                            value={category}
                                                            onChange={(e) => setCategory(e.target.value)}
                                                        >
                                                            <option value="All">All categories</option>
                                                            <option value="Shirts">Shirts</option>
                                                            <option value="T-Shirts">T-Shirts</option>
                                                            <option value="Jeans">Jeans</option>
                                                            <option value="Jackets">Jackets</option>
                                                            <option value="Dresses">Dresses</option>
                                                            <option value="Shoes">Shoes</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </label>

                                                    <label className="filter-select">
                                                        <span>SORT BY</span>
                                                        <select
                                                            value={sort}
                                                            onChange={(e) => setSort(e.target.value)}
                                                        >
                                                            <option value="newest">Newest first</option>
                                                            <option value="low-high">Price: low to high</option>
                                                            <option value="high-low">Price: high to low</option>
                                                        </select>
                                                    </label>
                                                </div>
                                            </div>

                                        </ScrollReveal>


                                        {/* PRODUCT GRID */}

                                        <div className="product-grid">

                                            {filteredProducts.length === 0 ? (

                                                <div className="no-products">
                                                    <h3>
                                                        Nothing found.
                                                    </h3>

                                                    <p>
                                                        Try another search
                                                        or category.
                                                    </p>
                                                </div>

                                            ) : (

                                                filteredProducts.map(
                                                    (product) => (
                                                        <ScrollReveal key={product.id} direction="up" delay={Math.min(filteredProducts.indexOf(product) % 4, 3) * 100}>

                                                            <ProductCard
                                                                product={product}
                                                            />

                                                        </ScrollReveal>

                                                    )
                                                )

                                            )}

                                        </div>

                                    </section>

                                </div>
                            }
                        />


                        {/* =========================
                    PRODUCT DETAILS
                ========================= */}

                        <Route
                            path="/product/:id"
                            element={<ProductDetails />}
                        />


                        {/* =========================
                    AUTHENTICATION
                ========================= */}

                        <Route
                            path="/register"
                            element={<Register />}
                        />

                        <Route
                            path="/login"
                            element={<Login />}
                        />

                        <Route
                            path="/contact"
                            element={<Contact />}
                        />


                        {/* =========================
                    SELLER
                ========================= */}

                        <Route
                            path="/create-listing"
                            element={
                                <ProtectedRoute>
                                    <CreateListing />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-listings"
                            element={
                                <ProtectedRoute>
                                    <MyListings />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-listings/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <EditListing />
                                </ProtectedRoute>
                            }
                        />


                        {/* =========================
                    PURCHASE REQUESTS
                ========================= */}

                        <Route
                            path="/purchase-requests"
                            element={
                                <ProtectedRoute>
                                    <PurchaseRequests />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-requests"
                            element={
                                <ProtectedRoute>
                                    <MyRequests />
                                </ProtectedRoute>
                            }
                        />


                        {/* =========================
                    OFFERS / NEGOTIATION
                ========================= */}

                        <Route
                            path="/offers"
                            element={
                                <ProtectedRoute>
                                    <Offers />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/my-offers"
                            element={
                                <ProtectedRoute>
                                    <MyOffers />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/edit-profile"
                            element={
                                <ProtectedRoute>
                                    <EditProfile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/received-orders"
                            element={
                                <ProtectedRoute>
                                    <ReceivedOrders />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/orders/:id"
                            element={
                                <ProtectedRoute>
                                    <OrderDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-orders"
                            element={
                                <ProtectedRoute>
                                    <MyOrders />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payment/:id"
                            element={
                                <ProtectedRoute>
                                    <Payment />
                                </ProtectedRoute>
                            }
                        />

                    </Routes>
                </div>

                <Footer />
            </>
        </ToastProvider>
    );
}

export default App;