
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";

function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();

    useEffect(() => {
        const fetchOrder = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(
                    `http://localhost:5000/api/orders/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    showToast(
                        data.message || "Unable to fetch order.",
                        "error"
                    );
                    return;
                }

                setOrder(data);

            } catch (error) {
                console.error("Order details error:", error);
                showToast("Unable to connect to server.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, navigate, showToast]);

    if (loading) {
        return <main className="activity-page">Loading order details...</main>;
    }

    if (!order) {
        return (
            <main className="activity-page">
                <h2>Order not found.</h2>
                <button onClick={() => navigate(-1)}>Go back</button>
            </main>
        );
    }

    const steps = [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED"
    ];

    const currentIndex = steps.indexOf(order.status);

    return (
        <main className="activity-page">

            <header className="activity-heading">
                <p className="section-eyebrow">ORDER #{order.id}</p>
                <h1>Order <em>details.</em></h1>
                <p>All the details of this purchase, in one place.</p>
            </header>

            <section className="order-detail-layout">

                <div className="order-detail-product">
                    <ProductImage
                        product={order}
                        alt={order.product_title}
                        width={500}
                    />

                    <p className="activity-eyebrow">{order.category}</p>
                    <h2>{order.product_title}</h2>

                    <p>{order.description}</p>

                    <p>Brand: {order.brand || "Not specified"}</p>
                    <p>Size: {order.size || "Not specified"}</p>
                    <p>Condition: {order.condition_status || "Not specified"}</p>
                    <p>Location: {order.location || "Not specified"}</p>
                </div>

                <div className="order-detail-info">

                    <h2>Purchase summary</h2>

                    <p>Order ID: #{order.id}</p>
                    <p>Amount: ₹{order.amount}</p>
                    <p>Payment: {order.payment_status}</p>
                    <p>Order status: {order.status.replaceAll("_", " ")}</p>

                    <hr />

                    <h3>Buyer</h3>
                    <p>{order.buyer_name}</p>
                    <p>{order.buyer_email}</p>

                    <hr />

                    <h3>Seller</h3>
                    <p>{order.seller_name}</p>
                    <p>{order.seller_email}</p>

                    <hr />

                    <h3>Order progress</h3>

                    <div className="order-progress">
                        {steps.map((step, index) => (
                            <div
                                className={`order-progress-step ${
                                    currentIndex >= index ? "completed" : ""
                                }`}
                                key={step}
                            >
                                <span>{currentIndex >= index ? "✓" : index + 1}</span>
                                <p>{step.replaceAll("_", " ")}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        className="activity-secondary-button"
                        onClick={() => navigate(-1)}
                    >
                        Go back
                    </button>

                </div>

            </section>

        </main>
    );
}

export default OrderDetails;
