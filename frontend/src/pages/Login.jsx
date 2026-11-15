
import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../utils/api";

function Login() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Handle email verification redirects
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.get("verified") === "1") {
            showToast(
                "Email verified successfully! You can now log in.",
                "success"
            );
        }

        if (params.get("verification") === "invalid") {
            showToast(
                "This verification link is invalid or expired. If your email is already verified, please log in. Otherwise, request a new verification link.",
                "error"
            );
        }

        if (params.has("verified") || params.has("verification")) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }
    }, [showToast]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showResend, setShowResend] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleLogin = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (data.code === "EMAIL_NOT_VERIFIED") {
                    setShowResend(true);
                    showToast(data.message, "error");
                } else {
                    showToast(data.message, "error");
                }

                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            showToast("Login successful!", "success");
            navigate("/");
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (error) {
            console.error("Login error:", error);
            showToast("Unable to connect to server", "error");
        }
    };

    const handleResendVerification = async () => {
        if (!email.trim()) {
            showToast("Please enter your email address.", "error");
            return;
        }

        setResendLoading(true);
        setResendMessage("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/resend-verification`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Unable to send reset link.", "error");
                return;
            }

            showToast(data.message, "success");

        } catch (error) {
            console.error("Forgot password error:", error);
            showToast("Unable to send reset link. Please try again.", "error");
        } finally {
            setResendLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            showToast("Please enter your email address.", "error");
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                }
            );

            const data = await response.json();
            showToast(data.message, "success");
        } catch (error) {
            console.error("Forgot password error:", error);
            showToast("Unable to send reset link. Please try again.", "error");
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-intro">
                    <p className="section-eyebrow">WELCOME BACK</p>
                    <h1>Good to see you <em>again.</em></h1>
                    <p>Sign in and pick up where your circular wardrobe left off.</p>
                </div>

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="auth-field">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-forgot">
                        <button type="button" onClick={handleForgotPassword}>
                            Forgot password?
                        </button>
                    </div>

                    {showResend && (
                        <div className="auth-resend-box">
                            <p>
                                Your email address is not verified yet.
                            </p>

                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendLoading}
                            >
                                {resendLoading
                                    ? "Sending..."
                                    : "Resend verification email"}
                            </button>

                            {resendMessage && (
                                <p className="auth-resend-message" role="status">
                                    {resendMessage}
                                </p>
                            )}
                        </div>
                    )}

                    <button className="auth-submit" type="submit">
                        Sign in <span>→</span>
                    </button>
                </form>

                <p className="auth-switch">
                    New to ReWear? <Link to="/register">Create an account</Link>
                </p>
            </section>

            <aside className="auth-side">
                <span className="auth-side-mark">R.</span>
                <p className="auth-side-label">THE CIRCULAR WARDROBE</p>
                <h2>Good clothes deserve <em>another story.</em></h2>
                <p className="auth-side-note">
                    Discover, exchange and give pre-loved pieces a new home.
                </p>
                <span className="auth-side-number">01 — REWEAR, REPEAT.</span>
            </aside>
        </main>
    );
}

export default Login;
