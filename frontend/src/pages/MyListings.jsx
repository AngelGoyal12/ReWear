
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProductImageUrls } from "../utils/productImages";

import {useToast} from "../context/ToastContext";

function MyListings() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);

    const fetchMyListings = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/products/my-listings",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
    showToast(data.message || "Unable to fetch your listings.", "error");
    return;
}

            setProducts(data);
        } catch (error) {
    console.error("Error fetching listings:", error);
    showToast("Unable to load your listings.", "error");
}
    };

    useEffect(() => {
        fetchMyListings();
    }, []);

    const handleDelete = async (productId) => {
        const token = localStorage.getItem("token");

        const confirmed = window.confirm(
            "Are you sure you want to delete this listing?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/${productId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
    showToast(data.message || "Unable to delete listing.", "error");
    return;
}

            showToast("Listing deleted successfully!", "success");
            fetchMyListings();
        } catch (error) {
            console.error("Delete listing error:", error);
            showToast("Unable to delete listing.", "error");
        }
    };

    return (
        <main className="my-listings-page">
            <section className="my-listings-heading">
                <p className="section-eyebrow">YOUR REWEAR COLLECTION</p>
                <h1>My Listings</h1>
                <p>Keep track of the pieces you've put back into circulation.</p>

                <button
                    className="listing-add-button"
                    onClick={() => navigate("/create-listing")}
                >
                    + List another item
                </button>
            </section>

            {products.length === 0 ? (
                <div className="listings-empty">
                    <span>✳</span>
                    <h2>Nothing here just yet.</h2>
                    <p>Your listed pieces will appear here.</p>

                    <button onClick={() => navigate("/create-listing")}>
                        Create your first listing
                    </button>
                </div>
            ) : (
                <section className="my-listings-grid">
                    {products.map((product) => {
                        const imageUrls = getProductImageUrls(product);
                        const imageUrl = imageUrls[0];

                        return (
                            <article className="my-listing-card" key={product.id}>
                                <div className="my-listing-image">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.title}
                                        />
                                    ) : (
                                        <span>No image available</span>
                                    )}

                                    <span className="listing-status">
                                        {product.status || "Available"}
                                    </span>
                                </div>

                                <div className="my-listing-info">
                                    <p className="listing-category">
                                        {product.category}
                                    </p>

                                    <h2>{product.title}</h2>

                                    <strong className="listing-price">
                                        ₹{product.price}
                                    </strong>

                                    <div className="listing-meta">
                                        <span>Size: {product.size || "N/A"}</span>
                                        <span>
                                            Condition: {product.condition_status || "N/A"}
                                        </span>
                                    </div>

                                    {product.status?.toUpperCase() === "AVAILABLE" ? (
                                        <div className="listing-actions">
                                            <button
                                                className="listing-edit-button"
                                                onClick={() =>
                                                    navigate(`/my-listings/edit/${product.id}`)
                                                }
                                            >
                                                Edit listing
                                            </button>

                                            <button
                                                className="listing-delete-button"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="listing-sold-message">
                                            This item has been sold.
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

export default MyListings;
