import nodemailer from "nodemailer";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[character]));

const formatMoney = value => `BDT ${Number(value || 0).toLocaleString("en-BD")}`;

export async function sendOrderReceipt(order) {
  if (!order.email) return { sent: false, reason: "email-not-provided" };
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return { sent: false, reason: "smtp-not-configured" };

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  const rows = order.items.map(item => `<tr><td>${escapeHtml(item.name)} × ${Number(item.quantity)}</td><td>${formatMoney(item.price * item.quantity)}</td></tr>`).join("");
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || SMTP_USER;
  await transporter.sendMail({
    from,
    to: order.email,
    subject: `Order ${order.orderNumber} received`,
    text: [
      `Thank you for your order, ${order.customer}.`,
      `Order number: ${order.orderNumber}`,
      ...order.items.map(item => `${item.name} x ${item.quantity}: ${formatMoney(item.price * item.quantity)}`),
      `Subtotal: ${formatMoney(order.subtotal)}`,
      `Delivery: ${formatMoney(order.deliveryFee)}`,
      `Total: ${formatMoney(order.total)}`,
      `Delivery address: ${order.address}${order.district ? `, ${order.district}` : ""}`
    ].join("\n"),
    html: `<main style="font-family:Arial,sans-serif;color:#202923;max-width:640px;margin:auto"><h1 style="font-size:24px">Order received</h1><p>Thank you, ${escapeHtml(order.customer)}. We’ve received your order.</p><p><strong>Order ${escapeHtml(order.orderNumber)}</strong></p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Product</th><th align="right">Amount</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ${formatMoney(order.subtotal)}</p><p>Delivery: ${formatMoney(order.deliveryFee)}</p><p><strong>Total: ${formatMoney(order.total)}</strong></p><p>Delivering to: ${escapeHtml(order.address)}${order.district ? `, ${escapeHtml(order.district)}` : ""}</p><p>We’ll contact you to confirm delivery.</p></main>`
  });
  return { sent: true };
}
