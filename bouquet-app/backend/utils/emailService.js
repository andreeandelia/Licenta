import nodemailer from 'nodemailer'

let transporter;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getTransporter() {
    if (!transporter) {
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpUser || !smtpPass) {
            throw new Error('SMTP_USER and SMTP_PASS are required for Gmail SMTP');
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    }

    return transporter;
}

async function sendVerificationEmail(to, token, userName) {
    const mailer = getTransporter();
    const backendPort = process.env.PORT || '8081';
    const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${backendPort}`;
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const verifyUrl = `${appBaseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;
    const normalizedName = String(userName || '').trim();
    const safeName = escapeHtml(normalizedName || 'there');

    const html = `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;background-color:transparent;">
                    <tr>
                        <td align="center" style="padding:24px 12px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #f2d6e8;border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(229,0,121,0.08);">
                                <tr>
                                    <td style="background:#e50079 !important;padding:20px 24px;">
                                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ffffff;">Bloomery</p>
                                        <h1 style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:24px;line-height:1.3;color:#ffffff;">Confirm your email address</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:24px;font-family:Arial,sans-serif;color:#111827;line-height:1.65;">
                                        <p style="margin:0 0 8px 0;font-size:15px;color:#111827;font-weight:700;">Hi ${safeName},</p>
                                        <p style="margin:0 0 14px 0;font-size:15px;color:#111827;">Thank you for signing up. To activate your account, please confirm your email using the button below.</p>

                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto 18px auto;">
                                            <tr>
                                                <td align="center" style="border-radius:999px;background-color:#8b5cf6;background-image:linear-gradient(90deg,#ff3b92 0%,#8b5cf6 100%);">
                                                    <a href="${verifyUrl}" style="display:inline-block;padding:12px 22px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff !important;text-decoration:none;border-radius:999px;border:1px solid #7c3aed;background-color:#e50079 !important;">Verify Email</a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">If the button does not work, copy and paste the link below into your browser:</p>
                                        <p style="margin:0 0 16px 0;word-break:break-all;font-size:13px;">
                                            <a href="${verifyUrl}" style="color:#e50079 !important;text-decoration:underline;">${verifyUrl}</a>
                                        </p>

                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7edf4;border:1px solid #f2d6e8;border-radius:12px;">
                                            <tr>
                                                <td style="padding:12px 14px;font-family:Arial,sans-serif;font-size:12px;color:#6b7280;">
                                                    This verification link expires in 24 hours to keep your account secure.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
        `;

    const text = `Confirm your email address\n\nHi ${normalizedName || 'there'},\n\nThank you for signing up.\nVerify your account here: ${verifyUrl}\n\nThis verification link expires in 24 hours.`;

    const result = await mailer.sendMail({
        from: fromEmail,
        to,
        subject: 'Verify your email address',
        text,
        html,
    });

    return result;
}

async function sendPasswordResetEmail(to, token, userName) {
    const mailer = getTransporter();
    const frontendBaseUrl = String(process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const normalizedName = String(userName || '').trim();
    const safeName = escapeHtml(normalizedName || 'there');

    const html = `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;background-color:transparent;">
                    <tr>
                        <td align="center" style="padding:24px 12px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #f2d6e8;border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(229,0,121,0.08);">
                                <tr>
                                    <td style="background:#e50079 !important;padding:20px 24px;">
                                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ffffff;">Bloomery</p>
                                        <h1 style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:24px;line-height:1.3;color:#ffffff;">Reset your password</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:24px;font-family:Arial,sans-serif;color:#111827;line-height:1.65;">
                                        <p style="margin:0 0 8px 0;font-size:15px;color:#111827;font-weight:700;">Hi ${safeName},</p>
                                        <p style="margin:0 0 14px 0;font-size:15px;color:#111827;">We received a request to reset your password. Use the button below to set a new one.</p>

                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto 18px auto;">
                                            <tr>
                                                <td align="center" style="border-radius:999px;background-color:#8b5cf6;background-image:linear-gradient(90deg,#ff3b92 0%,#8b5cf6 100%);">
                                                    <a href="${resetUrl}" style="display:inline-block;padding:12px 22px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff !important;text-decoration:none;border-radius:999px;border:1px solid #7c3aed;background-color:#e50079 !important;">Reset Password</a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;">If the button does not work, copy and paste the link below into your browser:</p>
                                        <p style="margin:0 0 16px 0;word-break:break-all;font-size:13px;">
                                            <a href="${resetUrl}" style="color:#e50079 !important;text-decoration:underline;">${resetUrl}</a>
                                        </p>

                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7edf4;border:1px solid #f2d6e8;border-radius:12px;">
                                            <tr>
                                                <td style="padding:12px 14px;font-family:Arial,sans-serif;font-size:12px;color:#6b7280;">
                                                    This password reset link expires in 30 minutes.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
        `;

    const text = `Reset your password\n\nHi ${normalizedName || 'there'},\n\nUse this link to reset your password: ${resetUrl}\n\nThis link expires in 30 minutes.`;

    const result = await mailer.sendMail({
        from: fromEmail,
        to,
        subject: 'Reset your password',
        text,
        html,
    });

    return result;
}

const ORDER_STATUS_EMAIL_CONTENT = {
    CONFIRMED: {
        subject: 'Your order has been confirmed',
        heading: 'Order confirmed',
        text: 'We have confirmed your order and will start preparing your bouquet shortly.',
    },
    IN_PREPARATION: {
        subject: 'Your order is in preparation',
        heading: 'We are preparing your order',
        text: 'Our florists are currently crafting your bouquet with attention to every detail.',
    },
    IN_DELIVERY: {
        subject: 'Your order is out for delivery',
        heading: 'Your order is on the way',
        text: 'Your courier is on the way and your order will arrive at your delivery address soon.',
    },
    DELIVERED: {
        subject: 'Your order has been delivered',
        heading: 'Order delivered',
        text: 'Your order was delivered successfully. Thank you for choosing Bloomery!',
    },
};

async function sendOrderStatusEmail(to, orderId, orderStatus, customerName) {
    const content = ORDER_STATUS_EMAIL_CONTENT[String(orderStatus || '').toUpperCase()];
    if (!content) {
        return null;
    }

    const mailer = getTransporter();
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const normalizedName = String(customerName || '').trim();
    const safeName = escapeHtml(normalizedName || 'there');
    const safeOrderId = escapeHtml(String(orderId || ''));

    const html = `
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:0;background-color:transparent;">
                    <tr>
                        <td align="center" style="padding:24px 12px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="width:100%;max-width:640px;background-color:#ffffff;border:1px solid #f2d6e8;border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(229,0,121,0.08);">
                                <tr>
                                    <td style="background:#e50079 !important;padding:20px 24px;">
                                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ffffff;">Bloomery</p>
                                        <h1 style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:24px;line-height:1.3;color:#ffffff;">${content.heading}</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:24px;font-family:Arial,sans-serif;color:#111827;line-height:1.65;">
                                        <p style="margin:0 0 8px 0;font-size:15px;color:#111827;font-weight:700;">Hi ${safeName},</p>
                                        <p style="margin:0 0 14px 0;font-size:15px;color:#111827;">${content.text}</p>
                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7edf4;border:1px solid #f2d6e8;border-radius:12px;">
                                            <tr>
                                                <td style="padding:12px 14px;font-family:Arial,sans-serif;font-size:13px;color:#6b7280;">
                                                    Order number: ${safeOrderId}<br />
                                                    Current status: ${escapeHtml(String(orderStatus || ''))}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
        `;

    const subjectWithOrderNumber = `${content.subject}`;
    const text = `${content.heading}\n\nHi ${normalizedName || 'there'},\n\n${content.text}\n\nOrder number: ${String(orderId || '')}\nCurrent status: ${String(orderStatus || '')}`;

    const result = await mailer.sendMail({
        from: fromEmail,
        to,
        subject: subjectWithOrderNumber,
        text,
        html,
    });

    return result;
}

export { sendVerificationEmail, sendPasswordResetEmail, sendOrderStatusEmail };
