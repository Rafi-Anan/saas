import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Menu, Minus, Moon, Plus, Search, ShoppingBag, ShoppingCart, Store, Sun, Trash2, Truck, X } from "lucide-react";
import { addNavigationLink, createOrder, deleteNavigationLink, getBanners, getManageBanners, getManageNavigation, getNavigation, getProduct, getProducts, saveBanners, trackOrder, updateNavigationLink, uploadLandingVideo, uploadProductImages } from "./api";
import { getGuestOrders, saveGuestOrder } from "./guestOrders";

const CartContext = createContext(null);
const money = value => `৳${Number(value || 0).toLocaleString("en-BD")}`;
const THEME_STORAGE_KEY = "h2r-store-theme";
const getSavedTheme = () => {
  try { return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark"; }
  catch { return "dark"; }
};
const fallbackBanners = [
  { title: "Good things,\nwell chosen.", subtitle: "Thoughtful essentials for the way you live, work and move.", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600", link: "/shop", buttonLabel: "Explore the collection" },
  { title: "Everyday pieces.\nMade to last.", subtitle: "Find your next favorite at H2R Online.", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600", link: "/shop", buttonLabel: "Shop new arrivals" }
];

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("h2r-cart") || "[]"); }
    catch { return []; }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState(getSavedTheme);
  useEffect(() => localStorage.setItem("h2r-cart", JSON.stringify(items)), [items]);
  useEffect(() => {
    document.documentElement.dataset.storeTheme = theme;
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
  }, [theme]);
  function add(product, options = {}) {
    const key = `${product._id}-${Object.entries(options).sort().map(entry => entry.join(":")).join("|")}`;
    setItems(current => current.some(item => item.key === key)
      ? current.map(item => item.key === key ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { key, productId: product._id, name: product.name, image: product.image, price: product.price, type: product.type || "simple", quantity: 1, options }]);
  }
  function setQuantity(key, quantity) {
    setItems(current => quantity < 1 ? current.filter(item => item.key !== key) : current.map(item => item.key === key ? { ...item, quantity } : item));
  }
  return <CartContext.Provider value={{ items, add, setQuantity, clear: () => setItems([]), searchTerm, setSearchTerm, theme, setTheme }}>{children}</CartContext.Provider>;
}

const useCart = () => useContext(CartContext);

function Header() {
  const { items, searchTerm, setSearchTerm, theme, setTheme } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigation, setNavigation] = useState([{ label: "Shop", href: "/shop" }, { label: "Collections", href: "/shop#collection" }]);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => { getNavigation().then(setNavigation).catch(() => {}); }, []);
  function submitSearch(event) {
    event.preventDefault();
    navigate("/shop");
  }
  return <header className="public-header"><div className="public-header-main"><Link className="public-brand" to="/"><span className="public-brand-mark">H</span><span>H2R <small>ONLINE</small></span></Link><nav className={`public-nav ${menuOpen ? "open" : ""}`}>{navigation.map(item => /^https?:\/\//i.test(item.href) ? <a href={item.href} key={item._id || item.label} onClick={() => setMenuOpen(false)}>{item.label}</a> : <Link onClick={() => setMenuOpen(false)} to={item.href} key={item._id || item.label}>{item.label}</Link>)}</nav><form className="public-search" role="search" onSubmit={submitSearch}><Search size={17}/><input aria-label="Search by product, category or price" placeholder="Search products, category or price" value={searchTerm} onChange={event => setSearchTerm(event.target.value)}/><button aria-label="Search" type="submit"><ArrowRight size={16}/></button></form><div className="public-actions"><button className="mobile-nav-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={17}/> : <Menu size={17}/>}</button><Link to="/cart" aria-label={`Cart, ${count} items`}><ShoppingCart size={18}/><span>Cart{count ? ` (${count})` : ""}</span></Link><Link to="/account"><Store size={17}/><span>Account</span></Link><button className="theme-toggle" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button></div></div></header>;
}

function Footer() {
  return <footer className="public-footer"><Link className="public-brand" to="/"><span className="public-brand-mark">H</span><span>H2R <small>ONLINE</small></span></Link><span>Thoughtful essentials, delivered across Bangladesh.</span><Link to="/account">Track an order</Link></footer>;
}

function HeroSlider() {
  const [banners, setBanners] = useState(fallbackBanners);
  const [active, setActive] = useState(0);
  useEffect(() => { getBanners().then(setBanners).catch(() => {}); }, []);
  useEffect(() => { setActive(0); }, [banners.length]);
  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = window.setInterval(() => setActive(index => (index + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);
  const current = banners[active] || fallbackBanners[0];
  function move(direction) { setActive(index => (index + direction + banners.length) % banners.length); }
  if (!banners.length) return null;
  const mediaType = current.mediaType || "image";
  const mediaUrl = current.mediaUrl || current.image;
  return <section className="hero-slider" aria-roledescription="carousel">{mediaType === "video" ? <video className="hero-slide-image hero-slide-video" src={mediaUrl} autoPlay muted loop playsInline/> : <img className="hero-slide-image" src={mediaUrl} alt=""/>}<div className="hero-slide-shade"/><div className="hero-slide-copy"><span className="eyebrow">THE H2R ONLINE EDIT</span><h1>{current.title.split("\n").map((line, index) => <span key={index}>{line}{index < current.title.split("\n").length - 1 && <br/>}</span>)}</h1><p>{current.subtitle}</p><Link className="hero-cta" to={current.link || "/shop"}>{current.buttonLabel || "Shop now"}<ArrowRight size={16}/></Link></div><div className="hero-slider-controls"><span className="slide-count">{String(active + 1).padStart(2, "0")} <i/> {String(banners.length).padStart(2, "0")}</span><div className="slide-dots">{banners.map((banner, index) => <button aria-label={`Show slide ${index + 1}`} aria-current={active === index} key={banner._id || index} onClick={() => setActive(index)}/>)}</div><button aria-label="Previous slide" onClick={() => move(-1)}><ChevronLeft size={18}/></button><button aria-label="Next slide" onClick={() => move(1)}><ChevronRight size={18}/></button></div></section>;
}

function ProductCard({ product }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [options, setOptions] = useState({});
  const variants = product.variants || [];
  const needsOptions = variants.length > 0;
  const ready = variants.every(variant => options[variant.label]);
  function addItem(goToCheckout) {
    if (needsOptions && !ready) return;
    add(product, options);
    navigate(goToCheckout ? "/checkout" : "/cart");
  }
  return <article className="public-product-card"><Link className="public-product-image" to={`/product/${product.slug}`}><img src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900"} alt={product.name}/>{product.compareAt > product.price && <span className="public-sale">SALE</span>}</Link><div className="public-product-info"><span className="eyebrow">{product.category || "H2R COLLECTION"}</span><div className="public-product-title"><h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3><strong>{money(product.price)}</strong></div>{product.compareAt > product.price && <del className="public-compare">{money(product.compareAt)}</del>}{needsOptions && <div className="card-variants">{variants.map(variant => <label key={variant.label}><span>{variant.label}</span><select aria-label={`${product.name} ${variant.label}`} value={options[variant.label] || ""} onChange={event => setOptions(current => ({ ...current, [variant.label]: event.target.value }))}><option value="">Choose</option>{variant.options.map(option => <option key={option}>{option}</option>)}</select></label>)}</div>}<div className="card-actions"><button className="card-add" disabled={!ready} onClick={() => addItem(false)}><ShoppingBag size={15}/>Add to cart</button><button className="card-buy" disabled={!ready} onClick={() => addItem(true)}>Buy now</button></div></div></article>;
}

export function StoreHome() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch(err => setError(err.message)); }, []);
  return <><Header/><main><HeroSlider/><section className="public-section" id="collection"><div className="public-section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>Shop the collection</h2></div><Link to="/shop">View all products <ArrowRight size={15}/></Link></div>{error ? <p className="public-notice">{error}. Products will load when the store API is available.</p> : products.length ? <div className="public-product-grid">{products.slice(0, 4).map(product => <ProductCard key={product._id} product={product}/>)}</div> : <p className="public-empty">Products are being added to this store.</p>}</section><section className="public-promises"><div><Truck/><span><b>Delivery across Bangladesh</b><small>Dhaka and nationwide rates shown at checkout</small></span></div><div><Check/><span><b>Cash on delivery</b><small>Pay when your order arrives</small></span></div><div><ShoppingBag/><span><b>Easy ordering</b><small>Track your parcel from your account</small></span></div></section></main><Footer/></>;
}

export function StoreShop() {
  const { searchTerm } = useCart();
  const [products, setProducts] = useState([]), [category, setCategory] = useState("All"), [sort, setSort] = useState("featured"), [minPrice, setMinPrice] = useState(""), [maxPrice, setMaxPrice] = useState(""), [error, setError] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch(err => setError(err.message)); }, []);
  const categories = ["All", ...new Set(products.map(product => product.category).filter(Boolean))];
  const filtered = useMemo(() => products.filter(product => {
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || product.name.toLowerCase().includes(query) || String(product.category || "").toLowerCase().includes(query) || String(product.price).includes(query);
    const matchesPrice = (!minPrice || product.price >= Number(minPrice)) && (!maxPrice || product.price <= Number(maxPrice));
    return matchesQuery && (category === "All" || product.category === category) && matchesPrice;
  }).sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0), [products, searchTerm, category, minPrice, maxPrice, sort]);
  return <><Header/><main className="public-section public-shop-page"><div className="public-shop-title"><div><span className="eyebrow">THE FULL COLLECTION</span><h1>{searchTerm ? `Search: ${searchTerm}` : "Shop all"}</h1></div><span>{filtered.length} products</span></div>{error && <p className="public-notice">{error}</p>}<div className="catalog-toolbar"><div className="catalog-categories">{categories.map(item => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="catalog-refine"><label>Min price<input type="number" min="0" placeholder="৳0" value={minPrice} onChange={event => setMinPrice(event.target.value)}/></label><label>Max price<input type="number" min="0" placeholder="No limit" value={maxPrice} onChange={event => setMaxPrice(event.target.value)}/></label><select aria-label="Sort products" value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div></div>{filtered.length ? <div className="public-product-grid">{filtered.map(product => <ProductCard key={product._id} product={product}/>)}</div> : <div className="public-empty">No products match your filters.</div>}</main><Footer/></>;
}

export function StoreProductPage() {
  const { slug } = useParams(), navigate = useNavigate(), { add } = useCart();
  const [product, setProduct] = useState(null), [options, setOptions] = useState({}), [error, setError] = useState("");
  useEffect(() => { getProduct(slug).then(setProduct).catch(err => setError(err.message)); }, [slug]);
  const ready = product?.variants?.every(variant => options[variant.label]) ?? true;
  function addItem(buyNow) { if (!product || !ready) return; add(product, options); navigate(buyNow ? "/checkout" : "/cart"); }
  return <><Header/>{error ? <main className="public-section"><p className="public-notice">{error}</p><Link to="/shop">Back to shop</Link></main> : !product ? <main className="public-section">Loading product…</main> : <main className="public-section public-detail"><div className="public-detail-image"><img src={product.image} alt={product.name}/></div><div className="public-detail-copy"><span className="eyebrow">{product.category || "H2R COLLECTION"}</span><h1>{product.name}</h1><div className="public-detail-price">{money(product.price)} {product.compareAt > product.price && <del>{money(product.compareAt)}</del>}</div><p>{product.description || "Considered essentials, selected for enduring quality and everyday use."}</p>{product.variants?.map(variant => <label className="detail-variant" key={variant.label}><span>{variant.label}</span><select value={options[variant.label] || ""} onChange={event => setOptions(current => ({ ...current, [variant.label]: event.target.value }))}><option value="">Choose {variant.label.toLowerCase()}</option>{variant.options.map(option => <option key={option}>{option}</option>)}</select></label>)}<div className="detail-buy-actions"><button className="card-add" disabled={!ready} onClick={() => addItem(false)}><ShoppingBag size={16}/>Add to cart</button><button className="dark-button" disabled={!ready} onClick={() => addItem(true)}>Buy now <ArrowRight size={15}/></button></div><small>{product.stock > 0 ? `${product.stock} in stock` : "Availability confirmed after order"}</small></div></main>}<Footer/></>;
}

export function StoreCart() {
  const { items, setQuantity } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <><Header/><main className="public-section public-cart"><span className="eyebrow">YOUR SELECTION</span><h1>Cart</h1>{items.length ? <div className="public-cart-layout"><section className="public-cart-items">{items.map(item => <article className="public-cart-row" key={item.key}><img src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"} alt={item.name}/><div className="public-cart-product"><h2>{item.name}</h2><p>{Object.entries(item.options || {}).map(([key, value]) => `${key}: ${value}`).join(" · ") || "Standard"}</p><button onClick={() => setQuantity(item.key, 0)}><Trash2 size={13}/> Remove</button></div><div className="cart-quantity"><button aria-label="Decrease quantity" onClick={() => setQuantity(item.key, item.quantity - 1)}><Minus size={13}/></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(item.key, item.quantity + 1)}><Plus size={13}/></button></div><strong className="cart-item-total">{money(item.price * item.quantity)}</strong></article>)}</section><aside className="public-cart-summary"><h2>Cart total</h2><div><span>Items subtotal</span><b>{money(subtotal)}</b></div><p>Delivery is calculated at checkout: ৳80 inside Dhaka or ৳150 outside Dhaka.</p><div className="cart-grand-total"><strong>Cart total</strong><strong>{money(subtotal)}</strong></div><Link className="dark-button cart-buy-button" to="/checkout">Buy now <ArrowRight size={16}/></Link></aside></div> : <div className="public-empty">Your cart is empty.<p><Link className="dark-button" to="/shop">Continue shopping</Link></p></div>}</main><Footer/></>;
}

function LegacyStoreCheckout() {
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [deliveryZone, setDeliveryZone] = useState("inside-dhaka"), [order, setOrder] = useState(null), [error, setError] = useState(""), [submitting, setSubmitting] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiresDelivery = items.some(item => item.type !== "virtual");
  const deliveryFee = requiresDelivery ? deliveryZone === "inside-dhaka" ? 80 : 150 : 0;
  async function submit(event) {
    event.preventDefault(); setError(""); setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await createOrder({ customer: form.get("name"), phone: form.get("phone"), email: form.get("email"), address: form.get("address"), deliveryZone: requiresDelivery ? deliveryZone : undefined, items: items.map(({ productId, quantity, options }) => ({ productId, quantity, options })) });
      saveGuestOrder(result);
      setOrder(result);
      clear();
      navigate(`/invoice/${encodeURIComponent(result.orderNumber)}`);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }
  return <><Header/><main className="public-section public-checkout"><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1>{order ? <section className="order-success"><span><Check size={22}/></span><h2>Order received</h2><p>Order {order.orderNumber}. We’ll call to confirm your delivery.</p><Link className="dark-button" to="/shop">Continue shopping</Link></section> : items.length ? <div className="public-checkout-layout"><form className="public-checkout-form" onSubmit={submit}><h2>Delivery details</h2><label>Full name<input name="name" autoComplete="name" required/></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required/></label><label>Delivery address<textarea name="address" rows="3" autoComplete="street-address" required/></label>{requiresDelivery && <fieldset className="delivery-choice"><legend>Delivery area</legend><label><input type="radio" name="deliveryZone" checked={deliveryZone === "inside-dhaka"} onChange={() => setDeliveryZone("inside-dhaka")}/><span><b>Inside Dhaka</b><small>৳80 delivery</small></span></label><label><input type="radio" name="deliveryZone" checked={deliveryZone === "outside-dhaka"} onChange={() => setDeliveryZone("outside-dhaka")}/><span><b>Outside Dhaka</b><small>৳150 delivery</small></span></label></fieldset>}{error && <p className="form-error">{error}</p>}<button className="dark-button" disabled={submitting}>{submitting ? "Placing order…" : "Place order"}<ArrowRight size={15}/></button></form><aside className="public-cart-summary"><h2>Order summary</h2>{items.map(item => <div className="checkout-line" key={item.key}><span>{item.quantity} × {item.name}</span><b>{money(item.price * item.quantity)}</b></div>)}<div><span>Items subtotal</span><b>{money(subtotal)}</b></div>{requiresDelivery && <div><span>{deliveryZone === "inside-dhaka" ? "Inside Dhaka delivery" : "Outside Dhaka delivery"}</span><b>{money(deliveryFee)}</b></div>}<div className="cart-grand-total"><strong>Total</strong><strong>{money(subtotal + deliveryFee)}</strong></div><p>Cash on delivery. Delivery charges are calculated by the server.</p></aside></div> : <div className="public-empty">Your cart is empty. <Link to="/shop">Shop products</Link></div>}</main><Footer/></>;
}

function LegacyAccountPage() {
  const [order, setOrder] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError(""); setOrder(null);
    const form = new FormData(event.currentTarget);
    try { setOrder(await trackOrder({ orderNumber: form.get("orderNumber"), phone: form.get("phone") })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <><Header/><main className="public-section account-page"><span className="eyebrow">CUSTOMER ACCOUNT</span><h1>Track your order</h1><p>Enter your order number and the phone number used at checkout.</p><form className="tracking-form" onSubmit={submit}><label>Order number<input name="orderNumber" required/></label><label>Phone number<input name="phone" type="tel" required/></label>{error && <p className="form-error">{error}</p>}<button className="dark-button" disabled={loading}>{loading ? "Checking…" : "Find order"}<ArrowRight size={15}/></button></form>{order && <section className="tracking-result"><div><span className="eyebrow">ORDER {order.orderNumber}</span><b className="order-status">{order.status}</b></div><p>Placed {new Date(order.createdAt).toLocaleDateString()}</p><div className="tracking-total"><span>Order total</span><strong>{money(order.total)}</strong></div><ol>{order.statusHistory?.map((entry, index) => <li key={`${entry.status}-${index}`}><b>{entry.status}</b><small>{new Date(entry.changedAt).toLocaleString()}</small></li>)}</ol></section>}</main><Footer/></>;
}

export function StoreCheckout() {
  const { items, clear } = useCart();
  const navigate = useNavigate();
  const [deliveryZone, setDeliveryZone] = useState("inside-dhaka");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requiresDelivery = items.some(item => item.type !== "virtual");
  const deliveryFee = requiresDelivery ? deliveryZone === "inside-dhaka" ? 80 : 150 : 0;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const order = await createOrder({
        customer: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email"),
        address: form.get("address"),
        deliveryZone: requiresDelivery ? deliveryZone : undefined,
        items: items.map(({ productId, quantity, options }) => ({ productId, quantity, options }))
      });
      saveGuestOrder(order);
      clear();
      navigate(`/invoice/${encodeURIComponent(order.orderNumber)}`, { state: { order } });
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  return <><Header/><main className="public-section public-checkout"><span className="eyebrow">ALMOST YOURS</span><h1>Checkout</h1>{items.length ? <div className="public-checkout-layout"><form className="public-checkout-form" onSubmit={submit}><h2>Delivery details</h2><label>Full name<input name="name" autoComplete="name" required/></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" required/></label><label>Email for receipt (optional)<input name="email" type="email" autoComplete="email"/></label><label>Delivery address<textarea name="address" rows="3" autoComplete="street-address" required/></label>{requiresDelivery && <fieldset className="delivery-choice"><legend>Delivery area</legend><label><input type="radio" name="deliveryZone" checked={deliveryZone === "inside-dhaka"} onChange={() => setDeliveryZone("inside-dhaka")}/><span><b>Inside Dhaka</b><small>৳80 delivery</small></span></label><label><input type="radio" name="deliveryZone" checked={deliveryZone === "outside-dhaka"} onChange={() => setDeliveryZone("outside-dhaka")}/><span><b>Outside Dhaka</b><small>৳150 delivery</small></span></label></fieldset>}{error && <p className="form-error">{error}</p>}<button className="dark-button" disabled={submitting}>{submitting ? "Placing order…" : "Place order"}<ArrowRight size={15}/></button></form><aside className="public-cart-summary"><h2>Order summary</h2>{items.map(item => <div className="checkout-line" key={item.key}><span>{item.quantity} × {item.name}</span><b>{money(item.price * item.quantity)}</b></div>)}<div><span>Items subtotal</span><b>{money(subtotal)}</b></div>{requiresDelivery && <div><span>{deliveryZone === "inside-dhaka" ? "Inside Dhaka delivery" : "Outside Dhaka delivery"}</span><b>{money(deliveryFee)}</b></div>}<div className="cart-grand-total"><strong>Total</strong><strong>{money(subtotal + deliveryFee)}</strong></div><p>Cash on delivery. Email receipts are sent when mail is configured.</p></aside></div> : <div className="public-empty">Your cart is empty. <Link to="/shop">Shop products</Link></div>}</main><Footer/></>;
}

export function AccountPage() {
  const [guestOrders, setGuestOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { setGuestOrders(getGuestOrders()); }, []);

  async function submit(event) {
    event.preventDefault(); setLoading(true); setError(""); setOrder(null);
    const form = new FormData(event.currentTarget);
    try { setOrder(await trackOrder({ orderNumber: form.get("orderNumber"), phone: form.get("phone") })); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  return <><Header/><main className="public-section account-page"><span className="eyebrow">CUSTOMER ACCOUNT</span><h1>Your orders</h1>{guestOrders.length > 0 && <section className="guest-order-history"><h2>Orders on this device</h2>{guestOrders.map(saved => <article key={saved.orderNumber}><div><b>{saved.orderNumber}</b><small>{new Date(saved.createdAt).toLocaleDateString()} · {saved.status}</small></div><strong>{money(saved.total)}</strong><Link to={`/invoice/${encodeURIComponent(saved.orderNumber)}`}>View invoice</Link></article>)}</section>}<h2 className="account-track-title">Track an order</h2><p>Enter the order number and phone used at checkout to retrieve order details.</p><form className="tracking-form" onSubmit={submit}><label>Order number<input name="orderNumber" required/></label><label>Phone number<input name="phone" type="tel" required/></label>{error && <p className="form-error">{error}</p>}<button className="dark-button" disabled={loading}>{loading ? "Checking…" : "Find order"}<ArrowRight size={15}/></button></form>{order && <section className="tracking-result"><div><span className="eyebrow">ORDER {order.orderNumber}</span><b className="order-status">{order.status}</b></div><p>Placed {new Date(order.createdAt).toLocaleDateString()}</p><div className="tracking-total"><span>Order total</span><strong>{money(order.total)}</strong></div><ol>{order.statusHistory?.map((entry, index) => <li key={`${entry.status}-${index}`}><b>{entry.status}</b><small>{new Date(entry.changedAt).toLocaleString()}</small></li>)}</ol><Link className="account-invoice-link" to={`/invoice/${encodeURIComponent(order.orderNumber)}`}>Open invoice</Link></section>}</main><Footer/></>;
}

export function BannerEditor() {
  const [banners, setBanners] = useState([]), [error, setError] = useState(""), [saved, setSaved] = useState(false), [saving, setSaving] = useState(false);
  const [files, setFiles] = useState({});
  useEffect(() => { getManageBanners().then(items => setBanners(items.map(item => ({ ...item, mediaType: item.mediaType || "image", mediaUrl: item.mediaUrl || item.image || "" })))).catch(err => setError(err.message)); }, []);
  function update(index, key, value) { setBanners(current => current.map((banner, position) => position === index ? { ...banner, [key]: value } : banner)); setSaved(false); }
  function bannerKey(banner, index) { return banner._id || banner.clientId || String(index); }
  function addBanner() { if (banners.length >= 10) return; setBanners(current => [...current, { clientId: `new-${Date.now()}-${current.length}`, title: "", subtitle: "", mediaType: "image", mediaUrl: "", link: "/shop", buttonLabel: "Shop now", active: true }]); setSaved(false); }
  function removeBanner(index) { setBanners(current => current.filter((_, position) => position !== index)); setSaved(false); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setSaved(false);
    try {
      const prepared = await Promise.all(banners.map(async (banner, index) => {
        const file = files[bannerKey(banner, index)];
        let mediaUrl = banner.mediaUrl || "";
        if (file) {
          if (banner.mediaType === "video") mediaUrl = (await uploadLandingVideo(file)).url;
          else mediaUrl = (await uploadProductImages([file]))[0].url;
        }
        return { ...banner, mediaUrl, image: banner.mediaType === "image" ? mediaUrl : "" };
      }));
      const savedBanners = await saveBanners(prepared);
      setBanners(savedBanners.map(item => ({ ...item, mediaType: item.mediaType || "image", mediaUrl: item.mediaUrl || item.image || "" })));
      setFiles({}); setSaved(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return <form className="banner-editor" onSubmit={submit}><div className="banner-editor-head"><div><h2>Header slider</h2><p>Add, remove, and publish image or video slides shown below the header.</p></div><button className="admin-secondary" type="button" onClick={addBanner} disabled={banners.length >= 10}>Add slide</button></div>{banners.length ? banners.map((banner, index) => <fieldset className="banner-fields" key={bannerKey(banner, index)}><legend>Slide {index + 1}</legend><div className="banner-form-grid"><label>Headline<input value={banner.title || ""} onChange={event => update(index, "title", event.target.value)} required/></label><label>Button label<input value={banner.buttonLabel || ""} onChange={event => update(index, "buttonLabel", event.target.value)}/></label><label className="banner-wide">Subtitle<input value={banner.subtitle || ""} onChange={event => update(index, "subtitle", event.target.value)}/></label><label>Media type<select value={banner.mediaType} onChange={event => { update(index, "mediaType", event.target.value); update(index, "mediaUrl", ""); setFiles(current => ({ ...current, [bannerKey(banner, index)]: null })); }}><option value="image">Image</option><option value="video">Video</option></select></label><label>Choose from device<input type="file" accept={banner.mediaType === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"} onChange={event => setFiles(current => ({ ...current, [bannerKey(banner, index)]: event.target.files?.[0] || null }))}/><small>{files[bannerKey(banner, index)]?.name || "Or enter a media URL"}</small></label><label className="banner-wide">Media URL<input type="url" value={banner.mediaUrl || ""} onChange={event => update(index, "mediaUrl", event.target.value)} placeholder="https://…" required={!files[bannerKey(banner, index)]}/></label><label>Destination URL<input value={banner.link || "/shop"} onChange={event => update(index, "link", event.target.value)}/></label><label className="banner-active"><input type="checkbox" checked={banner.active !== false} onChange={event => update(index, "active", event.target.checked)}/> Show this slide</label></div><button type="button" className="text-danger" onClick={() => removeBanner(index)}>Remove slide</button></fieldset>) : <p className="public-empty">No slides configured. Add an image or video slide.</p>}{error && <p className="notice">{error}</p>}{saved && <p className="register-success">Slider saved. Active slides are live on the storefront.</p>}<button className="admin-primary" disabled={saving}>{saving ? "Saving…" : "Save slider"}</button></form>;
}

export function NavigationEditor() {
  const [links, setLinks] = useState([]), [drafts, setDrafts] = useState({}), [error, setError] = useState(""), [busyId, setBusyId] = useState("");
  async function refresh() { try { setLinks(await getManageNavigation()); setError(""); } catch (requestError) { setError(requestError.message); } }
  useEffect(() => { refresh(); }, []);
  function updateDraft(id, key, value) { setDrafts(current => ({ ...current, [id]: { ...current[id], [key]: value } })); }
  async function addLink() {
    setBusyId("new"); setError("");
    try { await addNavigationLink({ label: "New menu item", href: "/shop", active: true }); await refresh(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusyId(""); }
  }
  async function saveLink(link) {
    const draft = drafts[link._id] || link;
    setBusyId(link._id); setError("");
    try { await updateNavigationLink(link._id, { label: draft.label, href: draft.href }); setDrafts(current => { const next = { ...current }; delete next[link._id]; return next; }); await refresh(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusyId(""); }
  }
  async function toggleLink(link) {
    setBusyId(link._id); setError("");
    try { await updateNavigationLink(link._id, { active: !link.active }); await refresh(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusyId(""); }
  }
  async function removeLink(link) {
    if (!window.confirm(`Delete menu item “${link.label}”?`)) return;
    setBusyId(link._id); setError("");
    try { await deleteNavigationLink(link._id); await refresh(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusyId(""); }
  }
  return <section className="navigation-editor"><div className="banner-editor-head"><div><h2>Header menu</h2><p>Each menu item saves independently; adding one will not replace the others.</p></div><button className="admin-secondary" type="button" onClick={addLink} disabled={busyId === "new" || links.length >= 12}>{busyId === "new" ? "Adding…" : "Add menu item"}</button></div>{links.length ? links.map(link => { const draft = drafts[link._id] || link; return <div className="navigation-editor-row" key={link._id}><label>Label<input value={draft.label || ""} onChange={event => updateDraft(link._id, "label", event.target.value)} required maxLength="40" placeholder="Shop"/></label><label>Destination<input value={draft.href || ""} onChange={event => updateDraft(link._id, "href", event.target.value)} required placeholder="/shop or https://…"/></label><span className={`navigation-visibility ${link.active ? "visible" : "hidden"}`}>{link.active ? "Visible" : "Hidden"}</span><div className="navigation-row-actions"><button type="button" className="admin-secondary" onClick={() => saveLink(link)} disabled={busyId === link._id}>Save</button><button type="button" className="admin-secondary" onClick={() => toggleLink(link)} disabled={busyId === link._id}>{link.active ? "Hide" : "Show"}</button><button type="button" className="text-danger" onClick={() => removeLink(link)} disabled={busyId === link._id}>Delete</button></div></div>; }) : <p className="public-empty">No menu items yet. Add your first header link.</p>}{error && <p className="notice">{error}</p>}</section>;
}