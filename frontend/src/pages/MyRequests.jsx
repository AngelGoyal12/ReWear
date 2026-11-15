import API_BASE_URL from "../utils/api";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";

function MyRequests() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchRequests = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/products/my-requests`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    showToast(
                        data.message || "Unable to fetch your requests.",
                        "error"
                    );
                    return;
                }

                setRequests(data);

            } catch (error) {
                console.error("Error fetching requests:", error);
                showToast("Unable to load your requests.", "error");
            }
        };

        fetchRequests();
    }, [navigate]);

    return (
        <main className="activity-page">
            <header className="activity-heading">
                <p className="section-eyebrow">YOUR PURCHASES</p>
                <h1>My <em>requests.</em></h1>
                <p>Keep track of the items you've requested to purchase.</p>
            </header>

            {requests.length === 0 ? (
                <div className="activity-empty">
                    <span>◇</span>
                    <h2>No requests yet.</h2>
                    <p>When you request an item, its progress will appear here.</p>
                </div>
            ) : (
                <section className="activity-grid">
                    {requests.map((request) => (
                        <article className="activity-card" key={request.id}>
                            <div className="activity-card-image">
                                <ProductImage
                                    product={request}
                                    alt={request.title}
                                    width={300}
                                />
                            </div>

                            <div className="activity-card-content">
                                <p className="activity-eyebrow">PURCHASE REQUEST</p>
                                <h2>{request.title}</h2>

                                <div className="activity-price-row">
                                    <div>
                                        <small>Listed price</small>
                                        <strong>₹{request.price}</strong>
                                    </div>
                                </div>

                                <p className="activity-person">
                                    Seller: {request.seller_name}
                                </p>

                                <div className="activity-card-footer">
                                    <span className={`status-pill status-${String(request.status).toLowerCase()}`}>
                                        {request.status}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

export default MyRequests;
