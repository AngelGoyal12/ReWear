import API_BASE_URL from "../utils/api";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext"; 

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { showToast } = useToast();
    const [verificationPending, setVerificationPending] = useState(false);
    const [pendingMessage, setPendingMessage] = useState("");
    const [resendMessage, setResendMessage] = useState("");
    const [resendLoading, setResendLoading] = useState(false);

    const handleRegister = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name, email, password })
                }
            );

            const data = await response.json();

            if (response.status === 201) {
                setPendingMessage(data.message);
                setVerificationPending(true);
                return;
            }

            // Account may have been created even if email delivery failed.
            if (
                response.status === 503 &&
                data.message?.toLowerCase().includes("account was created")
            ) {
                setPendingMessage(data.message);
                setVerificationPending(true);
                return;
            }

            // Existing account awaiting verification
            if (
                response.status === 409 &&
                data.message?.toLowerCase().includes("awaiting email verification")
            ) {
                setPendingMessage(data.message);
                setVerificationPending(true);
                return;
            }

            showToast(data.message || "Registration failed.", "error");

        } catch (error) {
            console.error("Registration error:", error);
            showToast("Unable to connect to server.", "error");
        }
    };

    const handleResendVerification = async () => {
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

            setResendMessage(data.message);

        } catch (error) {
            console.error("Resend verification error:", error);
            setResendMessage(
                "Unable to send verification email. Please try again."
            );
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">

                {verificationPending ? (
                    <div className="auth-verification">
                        <div className="auth-verification-icon">✉</div>

                        <div className="auth-intro">
                            <p className="section-eyebrow">
                                ONE LAST STEP
                            </p>

                            <h1>
                                Verify your <em>email.</em>
                            </h1>

                            <p>
                                We've registered your account using:
                            </p>

                            <strong className="auth-verification-email">
                                {email}
                            </strong>

                            <p>
                                {pendingMessage}
                            </p>

                            <p>
                                Check your inbox and spam folder for the
                                verification link.
                            </p>
                        </div>

                        <button
                            className="auth-submit"
                            type="button"
                            onClick={handleResendVerification}
                            disabled={resendLoading}
                        >
                            {resendLoading
                                ? "Sending..."
                                : "Resend verification email"}
                            <span>→</span>
                        </button>

                        {resendMessage && (
                            <p className="auth-resend-message" role="status">
                                {resendMessage}
                            </p>
                        )}

                        <p className="auth-switch">
                            Already verified? <Link to="/login">Sign in</Link>
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="auth-intro">
                            <p className="section-eyebrow">
                                MAKE ROOM FOR SOMETHING NEW
                            </p>

                            <h1>
                                Join the <em>rewear</em> movement.
                            </h1>

                            <p>
                                Create your account and give great clothes
                                another chance.
                            </p>
                        </div>

                        <form className="auth-form" onSubmit={handleRegister}>
                            <div className="auth-field">
                                <label htmlFor="register-name">Full name</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="register-email">Email address</label>
                                <input
                                    id="register-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="register-password">Password</label>
                                <input
                                    id="register-password"
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
                            </div>

                            <button className="auth-submit" type="submit">
                                Create account <span>→</span>
                            </button>
                        </form>

                        <p className="auth-switch">
                            Already a member? <Link to="/login">Sign in</Link>
                        </p>
                    </>
                )}
            </section>

            <aside className="auth-side">
                <span className="auth-side-mark">R.</span>
                <p className="auth-side-label">THE CIRCULAR WARDROBE</p>
                <h2>
                    Style moves on. <em>So should your clothes.</em>
                </h2>
                <p className="auth-side-note">
                    Buy less new. Wear more loved. Pass it forward.
                </p>
                <span className="auth-side-number">01 — REWEAR, REPEAT.</span>
            </aside>
        </main>
    );
}

export default Register;
