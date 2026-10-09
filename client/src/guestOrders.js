const STORAGE_KEY = "h2r-guest-orders";

export function getGuestOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

export function saveGuestOrder(order) {
  const entry = {
    orderNumber: order.orderNumber,
    customer: order.customer,
    phone: order.phone,
    email: order.email || "",
    address: order.address,
    district: order.district || "",
    items: order.items || [],
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    deliveryZone: order.deliveryZone,
    total: order.total,
    status: order.status,
    payment: order.payment,
    createdAt: order.createdAt || new Date().toISOString(),
    emailSent: Boolean(order.emailSent)
  };
  const orders = [entry, ...getGuestOrders().filter(item => item.orderNumber !== entry.orderNumber)].slice(0, 20);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); }
  catch { return false; }
  return true;
}

export function getGuestOrder(orderNumber) {
  return getGuestOrders().find(order => order.orderNumber === orderNumber) || null;
}
