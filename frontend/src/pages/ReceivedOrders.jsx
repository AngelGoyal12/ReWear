
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";
function ReceivedOrders() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const token = localStorage.getItem("token");

    const fetchOrders = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/orders/received",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Unable to fetch received orders", "error");
                return;
            }

            setOrders(data);
        } catch (error) {
            console.error("Fetch received orders error:", error);
            showToast("Unable to connect to server", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchOrders();
    }, []);

    const getNextStatus = (status) => {
        const nextStatuses = {
            CONFIRMED: "PROCESSING",
            PROCESSING: "SHIPPED",
            SHIPPED: "DELIVERED"
        };

        return nextStatuses[status];
    };

    const updateStatus = async (orderId, status) => {
        if (!window.confirm(`Update order status to ${status}?`)) {
            return;
        }

        setUpdatingId(orderId);

        try {
            const response = await fetch(
                `http://localhost:5000/api/orders/${orderId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ status })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Unable to update order", "error");
                return;
            }

            showToast(data.message || "Order updated successfully", "success");
            await fetchOrders();

        } catch (error) {
            console.error("Update order error:", error);
            showToast("Unable to connect to server", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <main className="activity-page">Loading received orders...</main>;
    }

    return (
        <main className="activity-page">

            <header className="activity-heading">
                <p className="section-eyebrow">YOUR SALES</p>
                <h1>Orders <em>received.</em></h1>
                <p>Manage the orders placed for your listed pieces.</p>
            </header>

            {orders.length === 0 ? (
                <div className="activity-empty">
                    <span>◇</span>
                    <h2>No orders received yet.</h2>
                    <p>When someone purchases your item, the order will appear here.</p>
                </div>
            ) : (
                <section className="activity-grid">

                    {orders.map((order) => {
                        const nextStatus = getNextStatus(order.status);

                        return (
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
                                        Buyer: {order.buyer_name}
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

                                        {nextStatus && order.payment_status === "PAID" && (
                                            <button
                                                className="activity-primary-button"
                                                disabled={updatingId === order.id}
                                                onClick={() => updateStatus(order.id, nextStatus)}
                                            >
                                                {updatingId === order.id
                                                    ? "Updating..."
                                                    : `Mark as ${nextStatus}`}
                                            </button>
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
                        );
                    })}

                </section>
            )}

        </main>
    );
}

export default ReceivedOrders;
