import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";

function PurchaseRequests() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/products/purchase-requests",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to fetch your requests.",
                    "error"
                );
                return;
            }

            setRequests(data);

        } catch (error) {
            console.error(
                "Error fetching requests:",
                error
            );
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAccept = async (requestId) => {
        const token =
            localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/purchase-requests/${requestId}/accept`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to accept request.",
                    "error"
                );
                return;
            }

            showToast(
                data.message || "Request accepted successfully.",
                "success"
            );

            fetchRequests();

        } catch (error) {
            console.error(
                "Accept request error:",
                error
            );
        }
    };

    const handleReject = async (requestId) => {
        const token =
            localStorage.getItem("token");

        try {
            const response = await fetch(
                `http://localhost:5000/api/products/purchase-requests/${requestId}/reject`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                showToast(
                    data.message || "Unable to reject request.",
                    "error"
                );
                return;
            }

            showToast(
                data.message || "Purchase request declined.",
                "success"
            );

            fetchRequests();

        } catch (error) {
            console.error(
                "Reject request error:",
                error
            );
            showToast(
                "Unable to connect to server.",
                "error"
            );
        }
    };

    
    return (
        <main className="activity-page">
            <header className="activity-heading">
                <p className="section-eyebrow">SELLER SPACE</p>
                <h1>Buyer <em>requests.</em></h1>
                <p>Review people interested in purchasing your listed pieces.</p>
            </header>

            {requests.length === 0 ? (
                <div className="activity-empty">
                    <span>♡</span>
                    <h2>No buyer requests.</h2>
                    <p>Purchase requests for your listings will appear here.</p>
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
                                <p className="activity-eyebrow">INTERESTED BUYER</p>
                                <h2>{request.title}</h2>

                                <div className="activity-price-row">
                                    <div>
                                        <small>Listing price</small>
                                        <strong>₹{request.price}</strong>
                                    </div>
                                </div>

                                <div className="activity-person-details">
                                    <p><small>Buyer</small>{request.buyer_name}</p>
                                    <p><small>Email</small>{request.buyer_email}</p>
                                </div>

                                <div className="activity-card-footer">
                                    <span className={`status-pill status-${String(request.status).toLowerCase()}`}>
                                        {request.status}
                                    </span>
                                </div>

                                {request.status === "PENDING" && (
                                    <div className="activity-actions">
                                        <button
                                            className="action-primary"
                                            onClick={() => handleAccept(request.id)}
                                        >
                                            Accept request
                                        </button>
                                        <button
                                            className="action-secondary"
                                            onClick={() => handleReject(request.id)}
                                        >
                                            Decline
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

export default PurchaseRequests;