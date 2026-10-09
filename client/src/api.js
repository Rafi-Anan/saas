const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORE_SLUG = import.meta.env.VITE_STORE_SLUG || "demo";

function storeHeaders(headers = {}) {
  return { ...headers, "X-Store-Slug": STORE_SLUG };
}

async function request(path, options = {}) {
  const token = localStorage.getItem("h2r-admin-token");
  const headers = storeHeaders(options.headers);
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("h2r-admin-token");
      localStorage.removeItem("h2r-admin-user");
    }
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result;
}

export async function getProducts() {
  return request("/products");
}

export async function getProduct(slug) {
  return request(`/products/${encodeURIComponent(slug)}`);
}

export async function createOrder(data) {
  return request("/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}

export async function getReport() {
  return request("/reports/summary");
}

export const getOrders = () => request("/orders");
export const getCustomers = () => request("/customers");
export const createProduct = data => request("/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const uploadProductImages = files => {
  const body = new FormData();
  files.forEach(file => body.append("images", file));
  return request("/products/images", { method: "POST", body });
};
export const deleteProduct = id => request(`/products/${id}`, { method: "DELETE" });
export const updateOrderStatus = (id, status) => request(`/orders/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
export const loginAdmin = (email, password) => request("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
export const registerAdmin = (data) => request("/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const getBanners = () => request("/storefront/banners");
export const getManageBanners = () => request("/storefront/banners/manage");
export const saveBanners = banners => request("/storefront/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ banners }) });
export const getNavigation = () => request("/storefront/navigation");
export const getManageNavigation = () => request("/storefront/navigation/manage");
export const saveNavigation = links => request("/storefront/navigation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links }) });
export const addNavigationLink = data => request("/storefront/navigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const updateNavigationLink = (id, data) => request(`/storefront/navigation/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const deleteNavigationLink = id => request(`/storefront/navigation/${id}`, { method: "DELETE" });
export const trackOrder = data => request("/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const getLandingPages = () => request("/landing-pages");
export const getLandingPage = slug => request(`/landing-pages/${encodeURIComponent(slug)}`);
export const createLandingPage = data => request("/landing-pages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const updateLandingPage = (id, data) => request(`/landing-pages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const uploadLandingVideo = file => {
  const body = new FormData();
  body.append("video", file);
  return request("/landing-pages/media", { method: "POST", body });
};
export const getCouriers = () => request("/couriers");
export const saveCourier = (provider, data) => request(`/couriers/${provider}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const assignCourier = (orderId, provider) => request(`/orders/${orderId}/courier`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });

export { API };
