import API_BASE_URL from "../utils/api";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductImage from "../components/ProductImage";

import { useToast } from "../context/ToastContext";

function MyOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();
    const [confirmingOrderId, setConfirmingOrderId] = useState(null);

    const fetchOrders = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/orders/my-orders`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Unable to load orders", "error");
                return;
            }

            setOrders(data);

        } catch (error) {
            console.error("Fetch my orders error:", error);
            showToast("Unable to connect to server", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handlePayment = (orderId) => {
        navigate(`/payment/${orderId}`);
    };

    const handleCompleteOrder = async (orderId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/orders/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status: "COMPLETED"
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Unable to complete order", "error");
                return;
            }

            showToast(data.message || "Order completed successfully", "success");
            setConfirmingOrderId(null);
            fetchOrders();

        } catch (error) {
            console.error("Order completion error:", error);
            showToast("Unable to connect to server", "error");
        }
    };

    if (loading) {
        return <main className="activity-page">Loading your orders...</main>;
    }

    return (
        <main className="activity-page">

            <header className="activity-heading">
                <p className="section-eyebrow">YOUR PURCHASES</p>
                <h1>My <em>orders.</em></h1>
                <p>Every good find has a journey. Keep track of yours.</p>
            </header>

            {orders.length === 0 ? (
                <div className="activity-empty">
                    <span>◇</span>
                    <h2>No orders yet.</h2>
                    <p>Your confirmed purchases will appear here.</p>
                </div>
            ) : (
                <section className="activity-grid">

                    {orders.map((order) => (

                        <article className="activity-card" key={order.id}>

                            <div className="activity-card-image">
                                <ProductImage
                                    product={order}
                                    alt={order.product_title}
                                    width={300}
                                />
                            </div>

                            <div className="activity-card-content">

                                <p className="activity-eyebrow">
                                    ORDER #{order.id}
                                </p>

                                <h2>{order.product_title}</h2>

                                <div className="activity-price-row">
                                    <div>
                                        <small>Order amount</small>
                                        <strong>₹{order.amount}</strong>
                                    </div>
                                </div>

                                <p className="activity-person">
                                    Seller: {order.seller_name}
                                </p>

                                <p className="activity-person">
                                    Payment: {order.payment_status}
                                </p>

                                <div className="activity-card-footer">
                                    <span className={`status-pill status-${String(order.status).toLowerCase()}`}>
                                        {order.status.replaceAll("_", " ")}
                                    </span>
                                </div>

                                <div className="activity-actions">

                                    {order.status === "PENDING_PAYMENT" && (
                                        <button
                                            className="activity-primary-button"
                                            onClick={() => handlePayment(order.id)}
                                        >
                                            Pay now
                                        </button>
                                    )}

                                    {order.status === "DELIVERED" && (
                                        confirmingOrderId === order.id ? (
                                            <div className="order-confirm-box">
                                                <p>Have you received this item?</p>

                                                <button
                                                    className="activity-primary-button"
                                                    onClick={() => handleCompleteOrder(order.id)}
                                                >
                                                    Yes, confirm
                                                </button>

                                                <button
                                                    className="activity-secondary-button"
                                                    onClick={() => setConfirmingOrderId(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="activity-primary-button"
                                                onClick={() => setConfirmingOrderId(order.id)}
                                            >
                                                Confirm delivery
                                            </button>
                                        )
                                    )}

                                    <button
                                        className="activity-secondary-button"
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                    >
                                        View order
                                    </button>

                                </div>

                            </div>

                        </article>

                    ))}

                </section>
            )}

        </main>
    );
}

export default MyOrders;
