
const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error("BREVO_API_KEY is missing");
    }

    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is missing");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: process.env.EMAIL_FROM_NAME || "ReWear",
                email: process.env.EMAIL_FROM
            },
            to: [{ email: to }],
            subject,
            textContent: text,
            htmlContent: html
        })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || `Brevo email failed with status ${response.status}`
        );
    }

    return result;
};

const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl =
        `${process.env.BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: email,
        subject: "Verify your ReWear email address",

        text: `
Hello ${name},

Thank you for joining ReWear!

Please verify your email address using this link:

${verificationUrl}

This link expires in 30 minutes.

If you did not create a ReWear account, you can ignore this email.
        `,

        html: `
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 30px; color: #242424;">
    <h1 style="color: #c75c3c;">Welcome to ReWear!</h1>

    <p>Hello ${escapeHtml(name)},</p>

    <p>Thank you for joining our community.
    Please verify your email address to activate your account.</p>

    <a href="${verificationUrl}"
       style="display: inline-block; background: #c75c3c; color: white;
       text-decoration: none; padding: 14px 24px; border-radius: 5px;">
       Verify Email
    </a>

    <p style="margin-top: 25px;">This link expires in 30 minutes.</p>

    <p style="font-size: 12px; color: #777;">
        If you did not create this account, you can ignore this email.
    </p>
</div>
        `
    });
};

const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl =
        `${process.env.BACKEND_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`;

    await sendEmail({
        to: email,
        subject: "Reset your ReWear password",

        text: `Hello ${name},

We received a request to reset your ReWear password.

Open this link to choose a new password:
${resetUrl}

This link expires in 15 minutes. If you did not request this, you can ignore this email.

ReWear Team`,

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 25px;">
                <h2>Reset your ReWear password</h2>
                <p>Hello ${escapeHtml(name || "there")},</p>
                <p>We received a request to reset your ReWear password.</p>
                <p>
                    <a href="${resetUrl}"
                       style="display: inline-block; padding: 12px 20px; background: #222; color: white; text-decoration: none; border-radius: 6px;">
                       Reset Password
                    </a>
                </p>
                <p>This link expires in 15 minutes.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>ReWear Team</p>
            </div>
        `
    });
};

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
