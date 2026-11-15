
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendVerificationEmail = async (email, name, token) => {
    const verificationUrl =
        `${process.env.BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
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
        `${process.env.BACKEND_URL}/api/auth/reset-password?token=${token}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
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
                <p>Hello ${String(name || "there").replace(/[&<>"']/g, char => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[char]))},</p>
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
