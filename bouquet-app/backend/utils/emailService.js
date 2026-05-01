import { Resend } from 'resend';

let resendClient;

function getResendClient() {
    if (!resendClient) {
        const apiKey = String(process.env.RESEND_API_KEY || '').trim();

        if (!apiKey) {
            throw new Error('RESEND_API_KEY is required for sending emails');
        }

        resendClient = new Resend(apiKey);
    }

    return resendClient;
}

function getFromEmail() {
    return (
        process.env.EMAIL_FROM ||
        process.env.SMTP_FROM ||
        'Bloomery <onboarding@resend.dev>'
    );
}

async function sendEmail({ to, subject, text, html }) {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
        from: getFromEmail(),
        to,
        subject,
        text,
        html,
    });

    if (error) {
        throw new Error(error?.message || 'Could not send email with Resend');
    }

    return data;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function round2(value) {
    return Number(Number(value || 0).toFixed(2));
}

function formatMoney(value) {
    return `${round2(value).toFixed(2)} RON`;
}

function formatDeliveryOptionLabel(value) {
    const normalizedValue = String(value || '').trim().toUpperCase();

    if (normalizedValue === 'STANDARD') return 'Standard delivery';
    if (normalizedValue === 'SAME_DAY') return 'Same-day delivery';
    if (normalizedValue === 'EXPRESS') return 'Express delivery';

    return normalizedValue || 'N/A';
}

function buildDeliveryAddressLines(orderDetails) {
    const street = String(orderDetails?.deliveryStreet || '').trim();
    const city = String(orderDetails?.deliveryCity || '').trim();
    const state = String(orderDetails?.deliveryState || '').trim();
    const zipCode = String(orderDetails?.deliveryZipCode || '').trim();
    const deliveryDetails = String(orderDetails?.deliveryDetails || '').trim();

    const addressParts = [street, city, state, zipCode].filter(Boolean);
    const address = addressParts.join(', ');

    return {
        address: address || 'N/A',
        deliveryDetails: deliveryDetails || 'None',
    };
}

function hasDifferentBillingAddress(orderDetails) {
    const billingStreet = String(orderDetails?.billingStreet || '').trim();
    const billingCity = String(orderDetails?.billingCity || '').trim();
    const billingState = String(orderDetails?.billingState || '').trim();
    const billingZipCode = String(orderDetails?.billingZipCode || '').trim();

    return Boolean(billingStreet || billingCity || billingState || billingZipCode);
}

function buildBillingAddressLines(orderDetails) {
    const street = String(orderDetails?.billingStreet || '').trim();
    const city = String(orderDetails?.billingCity || '').trim();
    const state = String(orderDetails?.billingState || '').trim();
    const zipCode = String(orderDetails?.billingZipCode || '').trim();

    const addressParts = [street, city, state, zipCode].filter(Boolean);
    const address = addressParts.join(', ');

    return {
        address: address || 'N/A',
    };
}

function normalizeOrderLines(lines) {
    if (!Array.isArray(lines)) {
        return [];
    }

    return lines.map((line) => ({
        id: line?.id || '',
        quantity: Math.max(1, Number(line?.quantity || 1)),
        totalPrice: round2(line?.totalPrice),
        priceBouquetSnapshot: round2(line?.priceBouquetSnapshot),
        bouquet: line?.bouquet
            ? {
                id: line.bouquet.id || '',
                price: round2(line.bouquet.price),
                greetingCardMessage: String(
                    line.bouquet.greetingCardMessage || '',
                ).trim(),
                items: Array.isArray(line.bouquet.items)
                    ? line.bouquet.items.map((item) => ({
                        id: item?.id || '',
                        quantity: Math.max(1, Number(item?.quantity || 1)),
                        priceSnapshot: round2(item?.priceSnapshot),
                        product: item?.product
                            ? {
                                id: item.product.id || '',
                                name: String(item.product.name || '').trim(),
                                type: String(item.product.type || '').trim(),
                                imageUrl: String(
                                    item.product.imageUrl || '',
                                ).trim(),
                            }
                            : null,
                    }))
                    : [],
            }
            : null,
    }));
}

function buildOrderItemsHtml(lines) {
    const normalizedLines = normalizeOrderLines(lines);

    if (normalizedLines.length === 0) {
        return '';
    }

    const rowsHtml = normalizedLines
        .map((line, index) => {
            const bouquetNumber = index + 1;
            const bouquetLabel = line.bouquet?.items?.length
                ? line.bouquet.items
                    .map(
                        (item) =>
                            `${escapeHtml(item.product?.name || 'Product')} x${item.quantity}`,
                    )
                    .join(', ')
                : 'No bouquet details available';

            const greetingCardMessage = line.bouquet?.greetingCardMessage
                ? escapeHtml(line.bouquet.greetingCardMessage)
                : 'None';

            return `
            <tr>
                <td style="padding:14px 0;border-top:1px solid #f2d6e8;font-family:Arial,sans-serif;color:#111827;">
                    <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;">Custom Bouquet #${bouquetNumber}</p>
                    <p style="margin:0 0 4px 0;font-size:13px;color:#6b7280;">Quantity: ${line.quantity}</p>
                    <p style="margin:0 0 4px 0;font-size:13px;color:#6b7280;">Contents: ${bouquetLabel}</p>
                    <p style="margin:0;font-size:13px;color:#6b7280;">Greeting card: ${greetingCardMessage}</p>
                </td>
            </tr>
        `;
        })
        .join('');

    return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;background-color:#fff7fb;border:1px solid #f2d6e8;border-radius:12px;padding:0 14px;">
            <tr>
                <td style="padding:14px 0 10px 0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#111827;">
                    Ordered bouquets
                </td>
            </tr>
            ${rowsHtml}
        </table>
    `;
}

function buildOrderItemsText(lines) {
    const normalizedLines = normalizeOrderLines(lines);

    if (normalizedLines.length === 0) {
        return '';
    }

    const sections = normalizedLines.map((line, index) => {
        const bouquetNumber = index + 1;
        const bouquetLabel = line.bouquet?.items?.length
            ? line.bouquet.items
                .map((item) => `${item.product?.name || 'Product'} x${item.quantity}`)
                .join(', ')
            : 'No bouquet details available';

        const greetingCardMessage = line.bouquet?.greetingCardMessage || 'None';

        return [
            `Custom Bouquet #${bouquetNumber}`,
            `Quantity: ${line.quantity}`,
            `Contents: ${bouquetLabel}`,
            `Greeting card: ${greetingCardMessage}`,
        ].join('\n');
    });

    return `\n\nOrdered bouquets:\n${sections.join('\n\n')}`;
}

function buildOrderSummaryHtml(orderDetails) {
    const { address, deliveryDetails } = buildDeliveryAddressLines(orderDetails);
    const deliveryOption = formatDeliveryOptionLabel(orderDetails?.deliveryOption);
    const deliveryTax = formatMoney(orderDetails?.deliveryTax);
    const finalPrice = formatMoney(orderDetails?.finalPrice);

    const hasDifferentBilling = hasDifferentBillingAddress(orderDetails);
    const billingAddressLine = hasDifferentBilling
        ? `<br />Billing address: ${escapeHtml(buildBillingAddressLines(orderDetails).address)}`
        : '';

    return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;background-color:#f7edf4;border:1px solid #f2d6e8;border-radius:12px;">
            <tr>
                <td style="padding:12px 14px;font-family:Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.6;">
                    Delivery method: ${escapeHtml(deliveryOption)}<br />
                    Address: ${escapeHtml(address)}<br />
                    Delivery details: ${escapeHtml(deliveryDetails)}${billingAddressLine}<br />
                    Transport: ${escapeHtml(deliveryTax)}<br />
                    Total order: ${escapeHtml(finalPrice)}
                </td>
            </tr>
        </table>
    `;
}

function buildOrderSummaryText(orderDetails) {
    const { address, deliveryDetails } = buildDeliveryAddressLines(orderDetails);
    const deliveryOption = formatDeliveryOptionLabel(orderDetails?.deliveryOption);
    const deliveryTax = formatMoney(orderDetails?.deliveryTax);
    const finalPrice = formatMoney(orderDetails?.finalPrice);

    const hasDifferentBilling = hasDifferentBillingAddress(orderDetails);
    const billingAddressLine = hasDifferentBilling
        ? `Billing address: ${buildBillingAddressLines(orderDetails).address}\n`
        : '';

    return [
        '',
        'Delivery summary:',
        `Delivery method: ${deliveryOption}`,
        `Address: ${address}`,
        `Delivery details: ${deliveryDetails}`,
        billingAddressLine,
        `Transport: ${deliveryTax}`,
        `Total order: ${finalPrice}`,
    ]
        .filter(Boolean)
        .join('\n');
}

async function sendVerificationEmail(to, token, userName) {
    const backendPort = process.env.PORT || '8081';
    const appBaseUrl =
        process.env.APP_BASE_URL || `http://localhost:${backendPort}`;

    const verifyUrl = `${appBaseUrl}/api/auth/verify?token=${encodeURIComponent(
        token,
    )}`;

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

    const text = `Confirm your email address\n\nHi ${normalizedName || 'there'
        },\n\nThank you for signing up.\nVerify your account here: ${verifyUrl}\n\nThis verification link expires in 24 hours.`;

    return sendEmail({
        to,
        subject: 'Verify your email address',
        text,
        html,
    });
}

async function sendPasswordResetEmail(to, token, userName) {
    const frontendBaseUrl = String(
        process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
    ).replace(/\/$/, '');

    const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(
        token,
    )}`;

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

    const text = `Reset your password\n\nHi ${normalizedName || 'there'
        },\n\nUse this link to reset your password: ${resetUrl}\n\nThis link expires in 30 minutes.`;

    return sendEmail({
        to,
        subject: 'Reset your password',
        text,
        html,
    });
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

async function sendOrderStatusEmail(
    to,
    orderId,
    orderStatus,
    customerName,
    orderDetails = {},
) {
    const content =
        ORDER_STATUS_EMAIL_CONTENT[String(orderStatus || '').toUpperCase()];

    if (!content) {
        return null;
    }

    const normalizedName = String(customerName || '').trim();
    const safeName = escapeHtml(normalizedName || 'there');
    const safeOrderId = escapeHtml(String(orderId || ''));

    const orderItemsHtml = buildOrderItemsHtml(orderDetails?.lines);
    const orderItemsText = buildOrderItemsText(orderDetails?.lines);
    const orderSummaryHtml = buildOrderSummaryHtml(orderDetails);
    const orderSummaryText = buildOrderSummaryText(orderDetails);

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
                                        ${orderSummaryHtml}
                                        ${orderItemsHtml}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
        `;

    const text = `${content.heading}\n\nHi ${normalizedName || 'there'
        },\n\n${content.text}\n\nOrder number: ${String(
            orderId || '',
        )}\nCurrent status: ${String(
            orderStatus || '',
        )}${orderSummaryText}${orderItemsText}`;

    return sendEmail({
        to,
        subject: content.subject,
        text,
        html,
    });
}

export {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOrderStatusEmail,
};