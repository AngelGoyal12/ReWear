
import { useEffect, useState } from "react";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";

function Offers() {
    const [offers, setOffers] = useState([]);
    const [counterAmounts, setCounterAmounts] = useState({});
    const { showToast } = useToast();

    useEffect(() => {
        const fetchOffers = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            try {
                const response = await fetch(
                    "http://localhost:5000/api/products/offers",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    showToast(
                        data.message || "Unable to fetch offers.",
                        "error"
                    );
                    return;
                }

                setOffers(data);

            } catch (error) {
                console.error("Error fetching offers:", error);
                showToast("Unable to load offers.", "error");
            }
        };

        fetchOffers();
    }, []);

    const handleAccept = async (offerId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/offers/${offerId}/accept`,
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
                    data.message || "Unable to accept offer.",
                    "error"
                );
                return;
            }

            showToast(data.message || "Offer accepted successfully!", "success");

            setOffers((previousOffers) =>
                previousOffers.map((offer) =>
                    offer.id === offerId
                        ? { ...offer, status: "ACCEPTED" }
                        : offer
                )
            );

        } catch (error) {
            console.error("Error accepting offer:", error);
            showToast("Unable to connect to server.", "error");
        }
    };

    const handleReject = async (offerId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/offers/${offerId}/reject`,
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
                    data.message || "Unable to reject offer.",
                    "error"
                );
                return;
            }

            showToast(data.message || "Offer rejected.", "success");

            setOffers((previousOffers) =>
                previousOffers.map((offer) =>
                    offer.id === offerId
                        ? { ...offer, status: "REJECTED" }
                        : offer
                )
            );

        } catch (error) {
            console.error("Error rejecting offer:", error);
            showToast("Unable to connect to server.", "error");
        }
    };

    const handleCounterOffer = async (offerId) => {
        const token = localStorage.getItem("token");
        const amount = counterAmounts[offerId];

        if (!amount || Number(amount) <= 0) {
            showToast(
                "Please enter a valid counter offer amount.",
                "error"
            );
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/offers/${offerId}/counter`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        offer_amount: Number(amount)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to send counter offer.",
                    "error"
                );
                return;
            }

            showToast(data.message || "Counter offer sent successfully!", "success");

            setOffers((previousOffers) =>
                previousOffers.map((offer) =>
                    offer.id === offerId
                        ? { ...offer, status: "COUNTERED" }
                        : offer
                )
            );

        } catch (error) {
            console.error("Error creating counter offer:", error);
            showToast("Unable to connect to server.", "error");
        }
    };

    return (
        <main className="activity-page">
            <header className="activity-heading">
                <p className="section-eyebrow">SELLER SPACE</p>
                <h1>Offers <em>received.</em></h1>
                <p>Review offers, negotiate prices and find the right next owner.</p>
            </header>

            {offers.length === 0 ? (
                <div className="activity-empty">
                    <span>↗</span>
                    <h2>No offers received yet.</h2>
                    <p>Offers from interested buyers will appear here.</p>
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
                                <p className="activity-eyebrow">BUYER OFFER</p>
                                <h2>{offer.title}</h2>

                                <div className="activity-price-row">
                                    <div>
                                        <small>Listed price</small>
                                        <strong>₹{offer.price}</strong>
                                    </div>
                                    <div>
                                        <small>Buyer offer</small>
                                        <strong className="highlight-price">
                                            ₹{offer.offer_amount}
                                        </strong>
                                    </div>
                                </div>

                                <div className="activity-person-details">
                                    <p><small>Buyer</small>{offer.buyer_name}</p>
                                    <p><small>Email</small>{offer.buyer_email}</p>
                                </div>

                                <div className="activity-card-footer">
                                    <span className={`status-pill status-${String(offer.status).toLowerCase()}`}>
                                        {offer.status}
                                    </span>
                                </div>

                                {offer.status === "PENDING" && (
                                    <div className="offer-management">
                                        <div className="activity-actions">
                                            <button
                                                className="action-primary"
                                                onClick={() => handleAccept(offer.id)}
                                            >
                                                Accept offer
                                            </button>

                                            <button
                                                className="action-secondary"
                                                onClick={() => handleReject(offer.id)}
                                            >
                                                Reject
                                            </button>
                                        </div>

                                        <div className="counter-offer-box">
                                            <label htmlFor={`counter-${offer.id}`}>
                                                Or suggest your price
                                            </label>

                                            <div className="counter-offer-input">
                                                <span>₹</span>

                                                <input
                                                    id={`counter-${offer.id}`}
                                                    type="number"
                                                    min="1"
                                                    placeholder="Counter amount"
                                                    value={counterAmounts[offer.id] || ""}
                                                    onChange={(event) =>
                                                        setCounterAmounts({
                                                            ...counterAmounts,
                                                            [offer.id]: event.target.value
                                                        })
                                                    }
                                                />

                                                <button
                                                    onClick={() => handleCounterOffer(offer.id)}
                                                >
                                                    Send
                                                </button>
                                            </div>
                                        </div>
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

export default Offers;
