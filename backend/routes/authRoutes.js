
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const pool = require("../config/db");

const {
    sendVerificationEmail,
    sendPasswordResetEmail
} = require("../services/emailService");

const router = express.Router();

const generateToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};


// ======================================
// REGISTER
// ======================================

router.post("/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (name.length > 100) {
            return res.status(400).json({
                message: "Name must be under 100 characters"
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email) || email.length > 254) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                message: "Password must be between 8 and 72 characters"
            });
        }

        const [existingUsers] = await pool.query(
            "SELECT id, is_verified FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: existingUsers[0].is_verified
                    ? "Email already registered"
                    : "This account is awaiting email verification. Please use Resend Verification."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await pool.query(
            `INSERT INTO users
             (name, email, password, is_verified)
             VALUES (?, ?, ?, 0)`,
            [name, email, hashedPassword]
        );

        const userId = result.insertId;
        const token = generateToken();
        const tokenHash = hashToken(token);

        await pool.query(
            `INSERT INTO email_verification_tokens
             (user_id, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))
             ON DUPLICATE KEY UPDATE
                token_hash = VALUES(token_hash),
                expires_at = VALUES(expires_at),
                created_at = CURRENT_TIMESTAMP`,
            [userId, tokenHash]
        );

        try {
            await sendVerificationEmail(email, name, token);
        } catch (emailError) {
            console.error("Verification email sending failed:", emailError);

            return res.status(503).json({
                message: "Your account was created, but the verification email could not be sent. Please use Resend Verification."
            });
        }

        return res.status(201).json({
            message: "Registration successful! Please check your email to verify your account."
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
});


// ======================================
// VERIFY EMAIL
// ======================================

router.get("/verify-email", async (req, res) => {
    try {
        const token = String(req.query.token || "");

        if (!/^[a-f0-9]{64}$/i.test(token)) {
            return res.status(400).send(
                "Invalid verification link."
            );
        }

        const tokenHash = hashToken(token);

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const [tokens] = await connection.query(
                `SELECT user_id
                 FROM email_verification_tokens
                 WHERE token_hash = ?
                 AND expires_at > UTC_TIMESTAMP()
                 FOR UPDATE`,
                [tokenHash]
            );

            if (tokens.length === 0) {
                await connection.rollback();

                return res.status(400).send(
                    "This verification link is invalid or expired. Please request a new one."
                );
            }

            const userId = tokens[0].user_id;

            await connection.query(
                `UPDATE users
                 SET is_verified = 1
                 WHERE id = ?`,
                [userId]
            );

            await connection.query(
                `DELETE FROM email_verification_tokens
                 WHERE user_id = ?`,
                [userId]
            );

            await connection.commit();

            return res.redirect(
                `${process.env.FRONTEND_URL}/login?verified=1`
            );

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).send(
            "Unable to verify your email right now. Please try again."
        );
    }
});


// ======================================
// RESEND VERIFICATION EMAIL
// ======================================

router.post("/resend-verification", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "Email address is required"
            });
        }

        const genericMessage =
            "If the account exists and needs verification, a verification email will be sent.";

        const [users] = await pool.query(
            `SELECT id, name, email, is_verified
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0 || users[0].is_verified) {
            return res.json({
                message: genericMessage
            });
        }

        const user = users[0];

        const [existingTokens] = await pool.query(
            `SELECT created_at
             FROM email_verification_tokens
             WHERE user_id = ?`,
            [user.id]
        );

        if (existingTokens.length > 0) {
            const [recentTokens] = await pool.query(
                `SELECT id
                 FROM email_verification_tokens
                 WHERE user_id = ?
                 AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 60 SECOND)`,
                [user.id]
            );

            if (recentTokens.length > 0) {
                return res.status(429).json({
                    message: "Please wait 60 seconds before requesting another verification email."
                });
            }
        }

        const token = generateToken();
        const tokenHash = hashToken(token);

        await pool.query(
            `INSERT INTO email_verification_tokens
             (user_id, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))
             ON DUPLICATE KEY UPDATE
                token_hash = VALUES(token_hash),
                expires_at = VALUES(expires_at),
                created_at = CURRENT_TIMESTAMP`,
            [user.id, tokenHash]
        );

        await sendVerificationEmail(
            user.email,
            user.name,
            token
        );

        return res.json({
            message: genericMessage
        });

    } catch (error) {
        console.error("Resend verification error:", error);

        return res.status(500).json({
            message: "Unable to send verification email right now"
        });
    }
});


// ======================================
// LOGIN
// ======================================

router.post("/login", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email address before logging in."
            });
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            jwtSecret,
            {
                expiresIn: "1d"
            }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed"
        });
    }
});

// Request a password reset
router.post("/forgot-password", async (req, res) => {
    let connection;

    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                message: "Please enter your email address"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.query(
            `SELECT id, name, email
             FROM users
             WHERE email = ?`,
            [normalizedEmail]
        );

        // Always return the same response to avoid revealing registered emails
        const response = {
            message: "If an account exists with this email, a reset link will be sent."
        };

        if (users.length === 0) {
            return res.json(response);
        }

        const user = users[0];

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString("hex");

        // Store only its SHA-256 hash
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?`,
            [user.id]
        );

        await connection.query(
            `INSERT INTO password_reset_tokens
             (user_id, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
            [user.id, tokenHash]
        );

        await connection.commit();

        try {
            await sendPasswordResetEmail(
                user.email,
                user.name,
                token
            );
        } catch (emailError) {
            console.error("Password reset email failed:", emailError);

            await pool.query(
                `DELETE FROM password_reset_tokens
                 WHERE user_id = ? AND token_hash = ?`,
                [user.id, tokenHash]
            );

            return res.status(503).json({
                message: "Unable to send reset email. Please try again."
            });
        }

        return res.json(response);

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Forgot password error:", error);

        return res.status(500).json({
            message: "Unable to process password reset request"
        });

    } finally {
        if (connection) connection.release();
    }
});

// Display the reset password form
router.get("/reset-password", (req, res) => {
    const { token } = req.query;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).send("Invalid password reset link.");
    }

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reset Password - ReWear</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f4f4f4;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                }

                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 380px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }

                h2 {
                    margin-top: 0;
                }

                input, button {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px;
                    margin-top: 12px;
                    border-radius: 6px;
                    font-size: 15px;
                }

                input {
                    border: 1px solid #ccc;
                }

                button {
                    border: none;
                    background: #222;
                    color: white;
                    cursor: pointer;
                }

                #message {
                    margin-top: 15px;
                    font-size: 14px;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <h2>Reset your password</h2>
                <p>Enter your new password below.</p>

                <form id="resetForm">
                    <input
                        type="password"
                        id="password"
                        placeholder="New password"
                        minlength="8"
                        required
                    >

                    <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        minlength="8"
                        required
                    >

                    <button type="submit">Update Password</button>
                </form>

                <p id="message"></p>
            </div>

            <script>
                const form = document.getElementById("resetForm");
                const message = document.getElementById("message");

                form.addEventListener("submit", async (event) => {
                    event.preventDefault();

                    const password =
                        document.getElementById("password").value;

                    const confirmPassword =
                        document.getElementById("confirmPassword").value;

                    if (password.length < 8) {
                        message.textContent =
                            "Password must contain at least 8 characters.";
                        return;
                    }

                    if (password !== confirmPassword) {
                        message.textContent =
                            "Passwords do not match.";
                        return;
                    }

                    try {
                        const response = await fetch(
                            "/api/auth/reset-password",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    token: "${token}",
                                    password
                                })
                            }
                        );

                        const data = await response.json();

                        message.textContent = data.message;

                        if (response.ok) {
                            form.reset();
                        }

                    } catch (error) {
                        message.textContent =
                            "Something went wrong. Please try again.";
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Save the new password
router.post("/reset-password", async (req, res) => {
    let connection;

    try {
        const { token, password } = req.body;

        if (
            !token ||
            !/^[a-f0-9]{64}$/i.test(token) ||
            typeof password !== "string" ||
            password.length < 8 ||
            password.length > 72
        ) {
            return res.status(400).json({
                message: "Invalid token or password. Password must contain 8–72 characters."
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const hashedPassword = await bcrypt.hash(password, 12);

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [tokens] = await connection.query(
            `SELECT user_id
             FROM password_reset_tokens
             WHERE token_hash = ?
             AND expires_at > NOW()
             FOR UPDATE`,
            [tokenHash]
        );

        if (tokens.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: "This reset link is invalid or has expired."
            });
        }

        const userId = tokens[0].user_id;

        await connection.query(
            `UPDATE users
             SET password = ?
             WHERE id = ?`,
            [hashedPassword, userId]
        );

        // Delete the used token so it cannot be reused
        await connection.query(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?`,
            [userId]
        );

        await connection.commit();

        return res.json({
            message: "Password updated successfully. You can now log in."
        });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Reset password error:", error);

        return res.status(500).json({
            message: "Unable to reset password"
        });

    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
