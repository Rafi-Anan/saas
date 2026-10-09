import { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, BarChart3, Box, Check, ChevronDown, FileText, LayoutDashboard, LogOut, Menu, Package, Search, Settings2, ShoppingBag, ShoppingCart, Store, Truck, Users, X } from "lucide-react";
import { assignCourier, createOrder, createProduct, deleteProduct, getCouriers, getCustomers, getOrders, getProduct, getProducts, getReport, loginAdmin, registerAdmin, updateOrderStatus } from "./api";
import { AccountPage, BannerEditor, CartProvider as PublicCartProvider, NavigationEditor, StoreCart, StoreCheckout, StoreHome, StoreProductPage, StoreShop } from "./PublicStorefront";
import LandingPagePublic from "./LandingPagePublic";
import LandingPagesAdmin from "./LandingPagesAdmin";
import CourierAdmin from "./CourierAdmin";
import ProductAdmin from "./ProductAdmin";
import InvoicePage from "./InvoicePage";

const CartContext = createContext(null);
const currency = value => `৳${Number(value || 0).toLocaleString("en-BD")}`;
const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"];
const metricIcons = [ShoppingBag, Package, Users, Box];
const useCart = () => useContext(CartContext);

function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem("h2r-cart") || "[]"));
  useEffect(() => localStorage.setItem("h2r-cart", JSON.stringify(items)), [items]);
  function add(product, options) {
    const key = `${product._id}-${JSON.stringify(options)}`;
    setItems(current => current.some(item => item.key === key)
      ? current.map(item => item.key === key ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { key, productId: product._id, name: product.name, image: product.image, price: product.price, quantity: 1, options }]);
  }
  function setQuantity(key, quantity) {
    setItems(current => quantity < 1 ? current.filter(item => item.key !== key) : current.map(item => item.key === key ? { ...item, quantity } : item));
  }
  return <CartContext.Provider value={{ items, add, setQuantity, clear: () => setItems([]) }}>{children}</CartContext.Provider>;
}

function Header() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return <header className="shop-header"><Link className="shop-brand" to="/"><span className="brand-mark">H</span><span>H2R <small>ONLINE</small></span></Link><nav><Link to="/shop">Shop</Link><a href="/shop#collection">Collections</a></nav><div className="shop-actions"><Link className="icon-link" aria-label="Shopping bag" to="/cart"><ShoppingCart size={18}/><span>Bag{count ? ` (${count})` : ""}</span></Link><Link className="text-link" to="/admin">Store admin <ArrowRight size={15}/></Link></div></header>;
}

function Footer() { return <footer className="store-footer"><Link className="shop-brand" to="/"><span className="brand-mark">H</span><span>H2R <small>ONLINE</small></span></Link><span>Thoughtful essentials for everyday living.</span><Link to="/admin">Manage your store</Link></footer>; }

function ProductCard({ product }) {
  return <article className="product-tile"><Link className="product-image" to={`/product/${product.slug}`}><img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900"} alt={product.name}/>{product.compareAt > product.price && <span className="sale-flag">SALE</span>}</Link><div className="product-meta"><div><span className="eyebrow">{product.category || "Collection"}</span><h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3></div><strong>{currency(product.price)}</strong></div><div className="product-subline"><span>{product.type === "variable" ? "Multiple options" : `${product.stock ?? 0} in stock`}</span>{product.compareAt > product.price && <del>{currency(product.compareAt)}</del>}</div></article>;
}

function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch(err => setError(err.message)); }, []);
  return <><Header/><main><section className="store-hero"><div className="hero-copy"><span className="eyebrow">THE EVERYDAY EDIT · DHAKA</span><h1>Good things,<br/><em>well chosen.</em></h1><p>Thoughtful essentials for the way you live, work and move.</p><Link className="dark-button" to="/shop">Explore the collection <ArrowRight size={16}/></Link><div className="hero-note"><span className="note-rule"/>Complimentary delivery on orders over ৳3,000</div></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1400" alt="Curated clothing collection"/><span className="image-caption">NEW SEASON / 01</span></div></section><section className="store-section" id="collection"><div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>New arrivals</h2></div><Link className="under-link" to="/shop">Shop all <ArrowRight size={16}/></Link></div>{error ? <p className="notice">{error}. Check the API connection and store configuration.</p> : products.length ? <div className="product-grid">{products.slice(0, 4).map(product => <ProductCard key={product._id} product={product}/>)}</div> : <p className="empty-state">Loading the collection…</p>}</section><section className="service-strip"><div><Truck/><span><b>Reliable delivery</b><small>Across Bangladesh</small></span></div><div><Check/><span><b>Cash on delivery</b><small>Pay when it arrives</small></span></div><div><ShoppingBag/><span><b>Thoughtful quality</b><small>Chosen with care</small></span></div></section></main><Footer/></>;
}

function Shop() {
  const [products, setProducts] = useState([]), [search, setSearch] = useState(""), [category, setCategory] = useState("All"), [sort, setSort] = useState("featured"), [error, setError] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch(err => setError(err.message)); }, []);
  const categories = ["All", ...new Set(products.map(product => product.category).filter(Boolean))];
  const visible = products.filter(product => (category === "All" || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0);
  return <><Header/><main className="store-section shop-page"><div className="shop-title"><div><span className="eyebrow">THE FULL COLLECTION</span><h1>Shop all</h1></div><span>{visible.length} products</span></div><div className="shop-toolbar"><div className="category-tabs">{categories.map(item => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="shop-controls"><label className="search-box"><Search size={17}/><input aria-label="Search products" placeholder="Search the collection" value={search} onChange={event => setSearch(event.target.value)}/></label><select aria-label="Sort products" value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div></div>{error && <p className="notice">{error}</p>}{visible.length ? <div className="product-grid">{visible.map(product => <ProductCard key={product._id} product={product}/>)}</div> : <div className="empty-state">No products match this search.</div>}</main><Footer/></>;
}

function ProductPage() {
  const { slug } = useParams(), navigate = useNavigate(), { add } = useCart();
  const [product, setProduct] = useState(null), [options, setOptions] = useState({}), [error, setError] = useState("");
  useEffect(() => { getProduct(slug).then(setProduct).catch(err => setError(err.message)); }, [slug]);
  return <><Header/>{error ? <main className="store-section"><p className="notice">{error}</p><Link to="/shop">Back to shop</Link></main> : !product ? <main className="store-section">Loading product…</main> : <main className="store-section detail-layout"><div className="detail-image"><img src={product.image} alt={product.name}/></div><div className="detail-copy"><span className="eyebrow">{product.category || "H2R COLLECTION"}</span><h1>{product.name}</h1><div className="detail-price">{currency(product.price)} {product.compareAt > product.price && <del>{currency(product.compareAt)}</del>}</div><p>{product.description || "Considered essentials, selected for enduring quality and everyday use."}</p>{product.variants?.map(variant => <fieldset className="variant-set" key={variant.label}><legend>{variant.label}{options[variant.label] ? `: ${options[variant.label]}` : ""}</legend><div className="variant-options">{variant.options.map(option => <button type="button" key={option} className={options[variant.label] === option ? "active" : ""} onClick={() => setOptions(current => ({ ...current, [variant.label]: option }))}>{option}</button>)}</div></fieldset>)}<button className="dark-button add-button" onClick={() => { add(product, options); navigate("/cart"); }}>Add to bag <span>{currency(product.price)}</span></button><small className="stock-note">{product.stock > 0 ? `${product.stock} available` : "Contact us for availability"} · Cash on delivery available</small></div></main>}<Footer/></>;
}

function Cart() {
  const { items, setQuantity } = useCart(), subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <><Header/><main className="store-section cart-page"><span className="eyebrow">YOUR SELECTION</span><h1>Shopping bag</h1>{items.length ? <div className="cart-layout"><div className="cart-items">{items.map(item => <article className="cart-item" key={item.key}><img src={item.image} alt=""/><div className="cart-item-copy"><h3>{item.name}</h3><p>{Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(" · ") || "Standard"}</p><button onClick={() => setQuantity(item.key, 0)}>Remove</button></div><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => setQuantity(item.key, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(item.key, item.quantity + 1)}>+</button></div><b>{currency(item.price * item.quantity)}</b></article>)}</div><aside className="order-summary"><h2>Order summary</h2><div><span>Subtotal</span><b>{currency(subtotal)}</b></div><div><span>Delivery</span><span>Calculated at checkout</span></div><hr/><div><strong>Total</strong><strong>{currency(subtotal)}</strong></div><Link className="dark-button full-button" to="/checkout">Continue to checkout <ArrowRight size={16}/></Link><small>Secure checkout · COD and prepaid</small></aside></div> : <div className="empty-state">Your bag is waiting for something lovely.<p><Link className="dark-button" to="/shop">Explore the collection</Link></p></div>}</main><Footer/></>;
}

function Checkout() {
  const { items, clear } = useCart(), [order, setOrder] = useState(null), [error, setError] = useState(""), [submitting, setSubmitting] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setError(""); const form = new FormData(event.currentTarget);
    try { const result = await createOrder({ customer: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address"), payment: form.get("payment"), items: items.map(({ productId, quantity, options }) => ({ productId, quantity, options })) }); setOrder(result); clear(); }
    catch (err) { setError(err.message); } finally { setSubmitting(false); }
  }
  return <><Header/><main className="store-section checkout-page"><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1>{order ? <section className="order-confirmation"><span><Check size={25}/></span><h2>Thank you. Your order is in.</h2><p>Order {order.orderNumber} · We’ll contact you to confirm delivery.</p><Link className="dark-button" to="/shop">Continue shopping <ArrowRight size={16}/></Link></section> : items.length ? <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><h2>Delivery details</h2><div className="field-row"><label>Full name<input name="name" required autoComplete="name"/></label><label>Phone number<input name="phone" required autoComplete="tel"/></label></div><label>Email address <span>Optional</span><input name="email" type="email" autoComplete="email"/></label><label>Delivery address<textarea name="address" required rows="3" autoComplete="street-address"/></label><label>Payment method<select name="payment"><option value="COD">Cash on delivery</option><option value="Prepaid">Prepaid</option></select></label>{error && <p className="form-error">{error}</p>}<button className="dark-button" disabled={submitting}>{submitting ? "Placing order…" : "Place order"} <ArrowRight size={16}/></button></form><aside className="order-summary"><h2>Your order</h2>{items.map(item => <div className="summary-product" key={item.key}><span>{item.quantity} × {item.name}</span><b>{currency(item.price * item.quantity)}</b></div>)}<hr/><div><strong>Total</strong><strong>{currency(subtotal)}</strong></div><small>Prices shown in Bangladeshi Taka (BDT).</small></aside></div> : <div className="empty-state">Your bag is empty. <Link to="/shop">Browse products</Link></div>}</main><Footer/></>;
}

const adminNav = [["Overview", "/admin", LayoutDashboard], ["Products", "/admin/products", Package], ["Orders", "/admin/orders", ShoppingBag], ["Customers", "/admin/customers", Users], ["Landing pages", "/admin/landing-pages", FileText], ["Couriers", "/admin/couriers", Truck], ["Reports", "/admin/reports", BarChart3], ["Store settings", "/admin/settings", Settings2]];
function AdminLayout({ children, title, active }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  function logout() { localStorage.removeItem("h2r-admin-token"); localStorage.removeItem("h2r-admin-user"); navigate("/admin/login"); }
  return <div className="admin-shell"><aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}><Link className="admin-logo" to="/admin"><span className="admin-logo-mark">H</span><span>H2R <small>COMMERCE</small></span></Link><div className="store-switcher"><span className="store-avatar">H</span><span><b>H2R Online</b><small>Online store</small></span><ChevronDown size={15}/></div><span className="sidebar-label">WORKSPACE</span><nav>{adminNav.map(([label, path, Icon]) => <Link key={path} className={active === path ? "active" : ""} to={path}><Icon size={18}/>{label}</Link>)}</nav><div className="sidebar-bottom"><div className="plan-note"><span className="plan-icon"><Store size={16}/></span><div><b>Store active</b><small>Growth workspace</small></div><span className="plan-status"/></div><Link to="/admin/settings"><span className="profile-avatar">HM</span><span className="profile-copy"><b>Store owner</b><small>Administrator</small></span><Settings2 size={17}/></Link></div></aside><main className="admin-main"><header className="admin-topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button><div className="breadcrumbs"><span>Workspace</span><span>/</span><b>{title}</b></div><div className="topbar-right"><span className="live-status"><i/> Store online</span><Link className="view-store-link" to="/">View store <ArrowRight size={14}/></Link><button className="logout-button" aria-label="Sign out" title="Sign out" onClick={logout}><LogOut size={16}/></button></div></header><section className="admin-content">{children}</section></main></div>;
}

function AdminHeading({ eyebrow, title, text, action }) { return <div className="admin-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function AdminHome() {
  const [data, setData] = useState(null), [error, setError] = useState("");
  useEffect(() => { getReport().then(setData).catch(err => setError(err.message)); }, []);
  const cards = [["Gross revenue", currency(data?.revenue), "Across current orders"], ["Orders", data?.orders ?? "—", "All order statuses"], ["Customers", data?.customers ?? "—", "Store customer list"], ["Products", data?.products ?? "—", "Active catalogue"]];
  return <AdminLayout title="Overview" active="/admin"><AdminHeading eyebrow="STORE OVERVIEW" title="Good morning." text="Here’s what’s happening with your store today." action={<Link className="admin-primary" to="/admin/products"><Package size={16}/> Add a product</Link>}/>{error && <p className="notice">API unavailable: {error}</p>}<div className="metric-grid">{cards.map(([label, value, note], index) => { const Icon = metricIcons[index]; return <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className={`metric-icon metric-${index}`}><Icon size={17}/></span></div><strong>{value}</strong><small>{note}</small></article>; })}</div><div className="admin-panels"><section className="panel"><div className="panel-head"><div><h2>Order performance</h2><p>Fulfillment across your store</p></div><Link to="/admin/orders">All orders <ArrowRight size={14}/></Link></div><div className="performance-list">{[["Delivered", data?.delivered || 0, "green"], ["Cancelled", data?.cancelled || 0, "red"], ["Returned", data?.returned || 0, "amber"]].map(([label, count, color]) => <div className="performance-row" key={label}><span className={`performance-dot ${color}`}/><span>{label}</span><b>{count}</b></div>)}</div></section><section className="panel quick-actions"><div className="panel-head"><div><h2>Quick actions</h2><p>Keep your store moving</p></div></div><Link to="/admin/products"><Package/><span><b>Add a product</b><small>Build your catalogue</small></span><ArrowRight/></Link><Link to="/admin/orders"><Truck/><span><b>Manage orders</b><small>Review fulfillment</small></span><ArrowRight/></Link></section></div></AdminLayout>;
}

function LegacyAdminProducts() {
  const [products, setProducts] = useState([]), [error, setError] = useState(""), [adding, setAdding] = useState(false), [saving, setSaving] = useState(false);
  async function refresh() { try { setProducts(await getProducts()); setError(""); } catch (err) { setError(err.message); } }
  useEffect(() => { refresh(); }, []);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget), name = form.get("name").trim();
    const data = { name, slug: form.get("slug").trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), category: form.get("category"), type: form.get("type"), price: Number(form.get("price")), compareAt: Number(form.get("compareAt")) || undefined, stock: Number(form.get("stock")), image: form.get("image"), status: "active" };
    try { await createProduct(data); setAdding(false); await refresh(); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function remove(product) { if (!window.confirm(`Delete ${product.name}?`)) return; try { await deleteProduct(product._id); await refresh(); } catch (err) { setError(err.message); } }
  return <AdminLayout title="Products" active="/admin/products"><AdminHeading eyebrow="CATALOGUE" title="Products" text="Manage products, pricing and inventory." action={<button className="admin-primary" onClick={() => setAdding(true)}><Package size={16}/> Add product</button>}/>{error && <p className="notice">{error}</p>}{adding && <form className="product-form panel" onSubmit={submit}><div className="panel-head"><div><h2>New product</h2><p>Product details appear in your storefront.</p></div><button type="button" className="close-button" aria-label="Close form" onClick={() => setAdding(false)}><X size={18}/></button></div><div className="form-grid"><label>Product name<input name="name" required/></label><label>URL slug<input name="slug" placeholder="Generated from name"/></label><label>Category<input name="category" placeholder="e.g. Accessories"/></label><label>Product type<select name="type"><option value="simple">Simple product</option><option value="variable">Variable product</option></select></label><label>Price (BDT)<input name="price" type="number" min="0" step="0.01" required/></label><label>Compare at<input name="compareAt" type="number" min="0" step="0.01"/></label><label>Stock quantity<input name="stock" type="number" min="0" defaultValue="0"/></label><label>Image URL<input name="image" type="url" placeholder="https://"/></label></div><div className="form-actions"><button type="button" className="admin-secondary" onClick={() => setAdding(false)}>Cancel</button><button className="admin-primary" disabled={saving}>{saving ? "Saving…" : "Save product"}</button></div></form>}<section className="panel table-panel"><div className="panel-head"><div><h2>All products</h2><p>{products.length} products in this store</p></div></div>{products.length ? <div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>TYPE</th><th>PRICE</th><th>INVENTORY</th><th>STATUS</th><th/></tr></thead><tbody>{products.map(product => <tr key={product._id}><td><div className="table-product"><img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80"} alt=""/><span><b>{product.name}</b><small>{product.category || "Uncategorized"}</small></span></div></td><td>{product.type}</td><td>{currency(product.price)}</td><td>{product.stock ?? 0} available</td><td><span className="status-pill status-active">Active</span></td><td><button className="text-danger" onClick={() => remove(product)}>Delete</button></td></tr>)}</tbody></table></div> : <div className="table-empty">{error ? "Products could not be loaded." : "No products yet. Add the first product to your catalogue."}</div>}</section></AdminLayout>;
}

function AdminProducts() { return <ProductAdmin/>; }

function AdminOrders() {
  const [orders, setOrders] = useState([]), [error, setError] = useState("");
  const [couriers, setCouriers] = useState([]);
  async function refresh() { try { const [orderList, courierList] = await Promise.all([getOrders(), getCouriers()]); setOrders(orderList); setCouriers(courierList); setError(""); } catch (err) { setError(err.message); } }
  useEffect(() => { refresh(); }, []);
  async function changeStatus(id, status) { try { await updateOrderStatus(id, status); await refresh(); } catch (err) { setError(err.message); } }
  async function changeCourier(id, provider) { try { await assignCourier(id, provider); await refresh(); } catch (err) { setError(err.message); } }
  return <AdminLayout title="Orders" active="/admin/orders"><AdminHeading eyebrow="FULFILLMENT" title="Orders" text="Review purchases and keep deliveries moving." action={<span className="count-chip">{orders.length} total</span>}/>{error && <p className="notice">{error}</p>}<section className="panel table-panel"><div className="panel-head"><div><h2>All orders</h2><p>Choose a configured courier for each shipment.</p></div></div>{orders.length ? <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>PAYMENT</th><th>TOTAL</th><th>COURIER</th><th>STATUS</th></tr></thead><tbody>{orders.map(order => <tr key={order._id}><td><b>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</b></td><td>{order.customer}<small className="table-sub">{order.phone}</small></td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{order.payment}</td><td><b>{currency(order.total)}</b></td><td><select className="status-select" aria-label={`Courier for ${order.orderNumber}`} value={order.courier?.provider || ""} onChange={event => event.target.value && changeCourier(order._id, event.target.value)}><option value="">Select courier</option>{couriers.map(courier => <option key={courier.id} value={courier.id} disabled={!courier.enabled || !courier.configured}>{courier.name}{courier.enabled && courier.configured ? "" : " (not configured)"}</option>)}</select></td><td><select className="status-select" value={order.status} onChange={event => changeStatus(order._id, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <div className="table-empty">{error ? "Orders could not be loaded." : "No orders yet."}</div>}</section></AdminLayout>;
}

function AdminCustomers() {
  const [customers, setCustomers] = useState([]), [error, setError] = useState("");
  useEffect(() => { getCustomers().then(setCustomers).catch(err => setError(err.message)); }, []);
  return <AdminLayout title="Customers" active="/admin/customers"><AdminHeading eyebrow="CUSTOMER RELATIONSHIPS" title="Customers" text="Order history and delivery reliability." action={<span className="count-chip">{customers.length} customers</span>}/>{error && <p className="notice">{error}</p>}<section className="panel table-panel"><div className="panel-head"><div><h2>Customer directory</h2><p>Delivery success is delivered orders divided by all orders.</p></div></div>{customers.length ? <div className="table-scroll"><table><thead><tr><th>CUSTOMER</th><th>PHONE</th><th>ORDERS</th><th>SPENT</th><th>SUCCESS</th><th>SEGMENT</th></tr></thead><tbody>{customers.map(customer => <tr key={customer._id}><td><b>{customer.name || "Customer"}</b><small className="table-sub">{customer.email || "—"}</small></td><td>{customer.phone}</td><td>{customer.orders}</td><td>{currency(customer.spent)}</td><td>{customer.success}%</td><td><span className={`status-pill ${["Excellent", "Good"].includes(customer.risk) ? "status-active" : "status-risk"}`}>{customer.risk}</span></td></tr>)}</tbody></table></div> : <div className="table-empty">{error ? "Customers could not be loaded." : "Customer records appear after the first order."}</div>}</section></AdminLayout>;
}

function AdminReports() {
  const [data, setData] = useState(null), [error, setError] = useState("");
  useEffect(() => { getReport().then(setData).catch(err => setError(err.message)); }, []);
  function exportCsv() { if (!data) return; const csv = ["Metric,Value", ...Object.entries(data).map(([key, value]) => `${key},${JSON.stringify(value)}`)].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "h2r-store-report.csv"; link.click(); URL.revokeObjectURL(link.href); }
  const values = [["Revenue", currency(data?.revenue)], ["Orders", data?.orders], ["Delivered", data?.delivered], ["Cancelled", data?.cancelled], ["Returned", data?.returned], ["Refunds", currency(data?.refunded)], ["Discounts", currency(data?.discounts)], ["COD sales", currency(data?.codSales)], ["Prepaid sales", currency(data?.prepaidSales)]];
  return <AdminLayout title="Reports" active="/admin/reports"><AdminHeading eyebrow="BUSINESS INTELLIGENCE" title="Reports" text="A snapshot of order and revenue performance." action={<button className="admin-secondary" onClick={exportCsv}><BarChart3 size={16}/> Export CSV</button>}/>{error && <p className="notice">{error}</p>}<div className="report-grid">{values.map(([label, value]) => <article className="metric-card" key={label}><small>{label}</small><strong>{value ?? "—"}</strong></article>)}</div></AdminLayout>;
}

function AdminSettings() { return <AdminLayout title="Store settings" active="/admin/settings"><AdminHeading eyebrow="STORE CONFIGURATION" title="Settings" text="Store identity and operating preferences."/><section className="panel settings-panel"><div><span className="settings-icon"><Store size={18}/></span><div><h2>Store identity</h2><p>Custom domains are resolved by the API. Configure the store slug in the client environment.</p></div></div><div className="settings-row"><span>Store slug</span><b>{import.meta.env.VITE_STORE_SLUG || "demo"}</b></div><div className="settings-row"><span>Currency</span><b>BDT · ৳</b></div><div className="settings-row"><span>Default timezone</span><b>Asia/Dhaka</b></div></section></AdminLayout>; }

function AdminBanners() { return <AdminLayout title="Store settings" active="/admin/settings"><AdminHeading eyebrow="STOREFRONT CONTENT" title="Header content" text="Edit the header menu and the image/video slider beneath it."/><NavigationEditor/><BannerEditor/></AdminLayout>; }
function AdminLandingPages() { return <AdminLayout title="Landing pages" active="/admin/landing-pages"><LandingPagesAdmin/></AdminLayout>; }
function AdminCouriers() { return <AdminLayout title="Couriers" active="/admin/couriers"><CourierAdmin/></AdminLayout>; }

function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await loginAdmin(form.get("email"), form.get("password"));
      localStorage.setItem("h2r-admin-token", result.token);
      localStorage.setItem("h2r-admin-user", JSON.stringify(result.user));
      navigate("/admin", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  return <main className="login-screen"><Link className="admin-logo" to="/"><span className="admin-logo-mark">H</span><span>H2R <small>COMMERCE</small></span></Link><form className="login-panel" onSubmit={submit}><span className="eyebrow">STORE WORKSPACE</span><h1>Welcome back.</h1><p>Sign in to manage your store.</p><label>Email address<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label>{error && <p className="form-error">{error}</p>}<button className="admin-primary" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"} <ArrowRight size={15}/></button><Link className="register-link" to="/admin/register">Register an admin account</Link></form><small className="login-foot">H2R Commerce · Bangladesh</small></main>;
}

function AdminRegister() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password"));
    if (password !== form.get("confirmPassword")) { setError("Passwords do not match"); return; }
    setSubmitting(true);
    try {
      const result = await registerAdmin({ name: form.get("name"), email: form.get("email"), password });
      setMessage(result.message);
      formElement.reset();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  return <main className="login-screen"><Link className="admin-logo" to="/"><span className="admin-logo-mark">H</span><span>H2R <small>COMMERCE</small></span></Link><form className="login-panel" onSubmit={submit}><span className="eyebrow">NEW WORKSPACE ACCOUNT</span><h1>Request access.</h1><p>New accounts require role approval before admin access is enabled.</p><label>Full name<input name="name" autoComplete="name" minLength="2" maxLength="100" required/></label><label>Email address<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength="12" maxLength="128" required/></label><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="12" maxLength="128" required/></label>{error && <p className="form-error">{error}</p>}{message && <p className="register-success">{message}</p>}<button className="admin-primary" disabled={submitting}>{submitting ? "Creating account…" : "Create account"} <ArrowRight size={15}/></button><Link className="register-link" to="/admin/login">Back to sign in</Link></form><small className="login-foot">H2R Commerce · Bangladesh</small></main>;
}

function RequireAdmin({ children }) {
  return localStorage.getItem("h2r-admin-token") ? children : <Navigate to="/admin/login" replace/>;
}

export default function CommerceApp() {
  return <PublicCartProvider><Routes><Route path="/" element={<StoreHome/>}/><Route path="/shop" element={<StoreShop/>}/><Route path="/product/:slug" element={<StoreProductPage/>}/><Route path="/cart" element={<StoreCart/>}/><Route path="/checkout" element={<StoreCheckout/>}/><Route path="/invoice/:orderNumber" element={<InvoicePage/>}/><Route path="/account" element={<AccountPage/>}/><Route path="/landing/:slug" element={<LandingPagePublic/>}/><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin/register" element={<AdminRegister/>}/><Route path="/admin" element={<RequireAdmin><AdminHome/></RequireAdmin>}/><Route path="/admin/products" element={<RequireAdmin><AdminProducts/></RequireAdmin>}/><Route path="/admin/orders" element={<RequireAdmin><AdminOrders/></RequireAdmin>}/><Route path="/admin/customers" element={<RequireAdmin><AdminCustomers/></RequireAdmin>}/><Route path="/admin/landing-pages" element={<RequireAdmin><AdminLandingPages/></RequireAdmin>}/><Route path="/admin/couriers" element={<RequireAdmin><AdminCouriers/></RequireAdmin>}/><Route path="/admin/reports" element={<RequireAdmin><AdminReports/></RequireAdmin>}/><Route path="/admin/settings" element={<RequireAdmin><AdminBanners/></RequireAdmin>}/></Routes></PublicCartProvider>;
}