
import { useEffect, useState } from "react";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";

function MyOffers() {
    const [offers, setOffers] = useState([]);
    const { showToast } = useToast();

    const fetchMyOffers = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/products/my-offers",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to fetch your offers.",
                    "error"
                );
                return;
            }

            setOffers(data);

        } catch (error) {
            console.error("Error fetching my offers:", error);
            showToast("Unable to load your offers.", "error");
        }
    };

    useEffect(() => {
        fetchMyOffers();
    }, []);

    const handleAcceptCounter = async (offerId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/offers/${offerId}/accept-counter`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to accept counter offer.",
                    "error"
                );
                return;
            }

            showToast(data.message || "Counter offer accepted!", "success");

            fetchMyOffers();

        } catch (error) {
            console.error("Error accepting counter offer:", error);
            showToast("Unable to connect to server.", "error");
        }
    };

    const handleRejectCounter = async (offerId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/offers/${offerId}/reject-counter`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to reject counter offer.",
                    "error"
                );
                return;
            }

            showToast(data.message || "Counter offer rejected.", "success");

            fetchMyOffers();

        } catch (error) {
            console.error("Error rejecting counter offer:", error);
            showToast("Unable to connect to server.", "error");
        }
    };

    return (
        <main className="activity-page">
            <header className="activity-heading">
                <p className="section-eyebrow">YOUR NEGOTIATIONS</p>
                <h1>My <em>offers.</em></h1>
                <p>Track the offers you've made and respond to counter offers.</p>
            </header>

            {offers.length === 0 ? (
                <div className="activity-empty">
                    <span>↗</span>
                    <h2>No offers yet.</h2>
                    <p>When you make an offer on an item, it will show up here.</p>
                </div>
            ) : (
                <section className="activity-grid">
                    {offers.map((offer) => (
                        <article className="activity-card" key={offer.id}>
                            <div className="activity-card-image">
                                <ProductImage
                                    product={offer}
                                    alt={offer.title}
                                    width={300}
                                />
                            </div>

                            <div className="activity-card-content">
                                <p className="activity-eyebrow">YOUR OFFER</p>
                                <h2>{offer.title}</h2>

                                <div className="activity-price-row">
                                    <div>
                                        <small>Listed price</small>
                                        <strong>₹{offer.price}</strong>
                                    </div>
                                    <div>
                                        <small>Your offer</small>
                                        <strong className="highlight-price">
                                            ₹{offer.offer_amount}
                                        </strong>
                                    </div>
                                </div>

                                <p className="activity-person">
                                    Seller: {offer.seller_name}
                                </p>

                                <div className="activity-card-footer">
                                    <span className={`status-pill status-${String(offer.status).toLowerCase()}`}>
                                        {offer.status}
                                    </span>
                                </div>

                                {offer.status === "PENDING" &&
                                    offer.parent_offer_id && (
                                        <div className="activity-actions">
                                            <button
                                                className="action-primary"
                                                onClick={() => handleAcceptCounter(offer.id)}
                                            >
                                                Accept counter
                                            </button>

                                            <button
                                                className="action-secondary"
                                                onClick={() => handleRejectCounter(offer.id)}
                                            >
                                                Reject counter
                                            </button>
                                        </div>
                                    )}
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

export default MyOffers;
