import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductImageUrls } from "../utils/productImages";
import {useToast} from "../context/ToastContext";
function ProductDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [product, setProduct] = useState(null);
    const [offerAmount, setOfferAmount] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchProduct = async () => {

            try {

                const response = await fetch(
                    `http://localhost:5000/api/products/${id}`
                );

                const data = await response.json();

                if (!response.ok) {

                    showToast(
                        data.message || "Unable to fetch product details.",
                        "error"
                    );

                    return;
                }

                setProduct(data);

            } catch (error) {

                console.error(
                    "Error fetching product:",
                    error
                );
                showToast(
                    "Unable to connect to server.",
                    "error"
                );

            } finally {

                setLoading(false);

            }
        };

        fetchProduct();

    }, [id, showToast]);


    const handlePurchaseRequest = async () => {

        const token = localStorage.getItem("token");

        if (!token) {

            showToast(
                "Please login to request this product.",
                "error"
            
            );

            navigate("/login");

            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/products/${id}/request`,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                showToast(
                    data.message || "Unable to send purchase request.",
                    "error"
                );

                return;
            }

            showToast(
                data.message || "Purchase request sent successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Purchase request error:",
                error
            );

            showToast(
                "Unable to connect to server.",
                "error"
            
            );
        }
    };


    const handleMakeOffer = async () => {

        const token = localStorage.getItem("token");
        
        if (!token) {

            showToast(
                "Please login to make an offer.",
                "error"
            );

            navigate("/login");

            return;
        }

        if (
            !offerAmount ||
            Number(offerAmount) <= 0
        ) {

            showToast(
                "Please enter a valid offer amount.",
                "error"
            );

            return;
        }

        try {

            const response = await fetch(
                `http://localhost:5000/api/products/${id}/offer`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        offer_amount:
                            Number(offerAmount)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                showToast(
                    data.message || "Unable to make offer.",
                    "error"
                );

                return;
            }

            showToast(
                data.message || "Offer made successfully.",
                "success"
            );

            setOfferAmount("");

        } catch (error) {

            console.error(
                "Make offer error:",
                error
            );

            showToast(
                "Unable to connect to server.",
                "error"
            );
        }
    };


    if (loading) {

        return (
            <div className="details-state">
                Loading product...
            </div>
        );
    }


    if (!product) {

        return (
            <div className="details-state">
                Product not found.
            </div>
        );
    }

    const images = getProductImageUrls(product);

    return (

        <main className="details-page">

            <button
                className="back-button"
                onClick={() => navigate(-1)}
            >
                ← Back to marketplace
            </button>


            <div className="details-layout">

                {/* =========================
                    IMAGE SIDE
                ========================= */}

                <section className="details-gallery">

                    {images.length > 0 ? (

                        images.map(
                            (image, index) => (

                                <img
                                    key={index}
                                    src={image}
                                    alt={`${product.title} ${index + 1}`}
                                />

                            )
                        )

                    ) : (

                        <div className="details-no-image">
                            No image available
                        </div>

                    )}

                </section>


                {/* =========================
                    INFORMATION SIDE
                ========================= */}

                <section className="details-info">

                    <p className="details-category">
                        {product.category}
                    </p>


                    <h1>
                        {product.title}
                    </h1>


                    <div className="details-price">
                        ₹{product.price}
                    </div>


                    <p className="details-description">
                        {product.description ||
                            "No description provided."}
                    </p>


                    <div className="details-divider"></div>


                    <div className="details-specs">

                        <div>
                            <span>
                                SIZE
                            </span>

                            <strong>
                                {product.size ||
                                    "Not specified"}
                            </strong>
                        </div>


                        <div>
                            <span>
                                CONDITION
                            </span>

                            <strong>
                                {product.condition_status ||
                                    "Not specified"}
                            </strong>
                        </div>


                        <div>
                            <span>
                                BRAND
                            </span>

                            <strong>
                                {product.brand ||
                                    "Not specified"}
                            </strong>
                        </div>


                        <div>
                            <span>
                                LOCATION
                            </span>

                            <strong>
                                {product.location ||
                                    "Not specified"}
                            </strong>
                        </div>

                    </div>


                    <div className="details-divider"></div>


                    {/* =========================
                        ACTIONS
                    ========================= */}

                    {product.status === "AVAILABLE" ? (

                        <div className="details-actions">

                            <button
                                className="buy-button"
                                onClick={
                                    handlePurchaseRequest
                                }
                            >
                                Request to Buy
                            </button>


                            <div className="offer-box">

                                <p>
                                    WANT TO NEGOTIATE?
                                </p>

                                <div className="offer-row">

                                    <input
                                        type="number"
                                        placeholder="Your offer"
                                        value={offerAmount}
                                        onChange={(event) =>
                                            setOfferAmount(
                                                event.target.value
                                            )
                                        }
                                    />

                                    <button
                                        onClick={
                                            handleMakeOffer
                                        }
                                    >
                                        Make Offer
                                    </button>

                                </div>

                            </div>

                        </div>

                    ) : (

                        <div className="sold-message">

                            <strong>
                                No longer available
                            </strong>

                            <span>
                                This item has already been sold
                                or is currently unavailable.
                            </span>

                        </div>

                    )}

                </section>

            </div>

        </main>

    );
}

export default ProductDetails;