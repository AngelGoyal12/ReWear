import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useToast } from "../context/ToastContext";

function Payment() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [result, setResult] = useState(null);

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
                    showToast(data.message || "Unable to load order", "error");
                    navigate("/my-orders");
                    return;
                }

                if (
                    data.status !== "PENDING_PAYMENT" ||
                    data.payment_status !== "PENDING"
                ) {
                    showToast("This order is not awaiting payment.", "info");
                    navigate(`/orders/${id}`);
                    return;
                }

                setOrder(data);

            } catch (error) {
                console.error("Order loading error:", error);
                showToast("Unable to connect to the server", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, navigate, showToast]);

    const handlePayment = async () => {
        const token = localStorage.getItem("token");

        if (!token || !order) {
            navigate("/login");
            return;
        }

        setProcessing(true);

        try {
            const response = await fetch(
                `http://localhost:5000/api/orders/${id}/pay`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        paymentMethod,
                        simulateFailure: false
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Payment could not be processed", "error");
                return;
            }

            setResult(data);

            if (data.paymentStatus === "PAID") {
                showToast("Payment completed successfully!", "success");
            } else {
                showToast(data.message || "Payment failed", "error");
            }

        } catch (error) {
            console.error("Payment error:", error);
            showToast("Unable to connect to the server", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <main className="payment-page">
                <p className="payment-loading">Preparing your payment...</p>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="payment-page">
                <p>Order details could not be loaded.</p>
                <button onClick={() => navigate("/my-orders")}>
                    Back to My Orders
                </button>
            </main>
        );
    }

    if (result) {
        const successful = result.paymentStatus === "PAID";

        return (
            <main className="payment-page">
                <div className="payment-result">
                    <div className={`payment-result-icon ${successful ? "success" : "failed"}`}>
                        {successful ? "✓" : "×"}
                    </div>

                    <p className="payment-eyebrow">ORDER #{order.id}</p>

                    <h1>
                        {successful ? (
                            <>Payment <em>successful.</em></>
                        ) : (
                            <>Payment <em>unsuccessful.</em></>
                        )}
                    </h1>

                    <p className="payment-result-message">
                        {result.message}
                    </p>

                    {result.transactionReference && (
                        <div className="payment-reference">
                            <small>TRANSACTION REFERENCE</small>
                            <strong>{result.transactionReference}</strong>
                        </div>
                    )}

                    <p className="payment-demo-note">
                        This is a simulated payment for the ReWear demonstration.
                        No real money has been transferred.
                    </p>

                    <div className="payment-result-actions">
                        {successful ? (
                            <button
                                className="payment-main-button"
                                onClick={() => navigate("/my-orders")}
                            >
                                View My Orders
                            </button>
                        ) : (
                            <>
                                <button
                                    className="payment-main-button"
                                    onClick={() => setResult(null)}
                                >
                                    Try Again
                                </button>

                                <button
                                    className="payment-back-button"
                                    onClick={() => navigate("/my-orders")}
                                >
                                    Back to My Orders
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="payment-page">

            <div className="payment-heading">
                <p className="payment-eyebrow">A LITTLE SOMETHING FOR YOU</p>
                <h1>Complete your <em>purchase.</em></h1>
                <p>One last step before your new find is yours.</p>
            </div>

            <div className="payment-layout">

                <section className="payment-form">

                    <div className="payment-section-heading">
                        <span>01</span>
                        <div>
                            <h2>Payment method</h2>
                            <p>Choose how you'd like to complete your order.</p>
                        </div>
                    </div>

                    <div className="payment-method-list">

                        <label className={`payment-method ${paymentMethod === "UPI" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="payment"
                                value="UPI"
                                checked={paymentMethod === "UPI"}
                                onChange={() => setPaymentMethod("UPI")}
                            />

                            <span className="payment-method-icon">↗</span>

                            <span className="payment-method-text">
                                <strong>UPI</strong>
                                <small>Google Pay, PhonePe, Paytm</small>
                            </span>

                            <span className="payment-radio" />
                        </label>

                        <label className={`payment-method ${paymentMethod === "CARD" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="payment"
                                value="CARD"
                                checked={paymentMethod === "CARD"}
                                onChange={() => setPaymentMethod("CARD")}
                            />

                            <span className="payment-method-icon">▤</span>

                            <span className="payment-method-text">
                                <strong>Credit / Debit Card</strong>
                                <small>Visa, Mastercard and more</small>
                            </span>

                            <span className="payment-radio" />
                        </label>

                        <label className={`payment-method ${paymentMethod === "NET_BANKING" ? "selected" : ""}`}>
                            <input
                                type="radio"
                                name="payment"
                                value="NET_BANKING"
                                checked={paymentMethod === "NET_BANKING"}
                                onChange={() => setPaymentMethod("NET_BANKING")}
                            />

                            <span className="payment-method-icon">⌂</span>

                            <span className="payment-method-text">
                                <strong>Net Banking</strong>
                                <small>Pay through your bank</small>
                            </span>

                            <span className="payment-radio" />
                        </label>

                    </div>

                    <div className="payment-demo-note payment-inline-note">
                        <strong>Demo checkout</strong>
                        <p>
                            This project uses simulated payments. You do not need
                            to enter card numbers, UPI PINs or banking credentials.
                        </p>
                    </div>

                    <button
                        className="payment-main-button"
                        onClick={handlePayment}
                        disabled={processing}
                    >
                        {processing
                            ? "Processing..."
                            : `Pay ₹${Number(order.amount).toFixed(2)}`}
                    </button>

                    <button
                        className="payment-back-button"
                        onClick={() => navigate("/my-orders")}
                        disabled={processing}
                    >
                        Back to My Orders
                    </button>

                </section>

                <aside className="payment-summary">

                    <p className="payment-eyebrow">YOUR ORDER</p>

                    <div className="payment-product">
                        <div className="payment-product-image">
                            <ProductImage
                                product={order}
                                alt={order.product_title}
                                width={160}
                            />
                        </div>

                        <div>
                            <h3>{order.product_title}</h3>
                            <p>Seller: {order.seller_name}</p>
                            <small>Order #{order.id}</small>
                        </div>
                    </div>

                    <div className="payment-summary-line">
                        <span>Order amount</span>
                        <strong>₹{Number(order.amount).toFixed(2)}</strong>
                    </div>

                    <div className="payment-summary-line">
                        <span>Payment method</span>
                        <strong>
                            {paymentMethod === "NET_BANKING"
                                ? "Net Banking"
                                : paymentMethod}
                        </strong>
                    </div>

                    <div className="payment-summary-total">
                        <span>Total to pay</span>
                        <strong>₹{Number(order.amount).toFixed(2)}</strong>
                    </div>

                    <p className="payment-summary-footnote">
                        Your order will be confirmed after successful payment.
                    </p>

                </aside>

            </div>
        </main>
    );
}

export default Payment;