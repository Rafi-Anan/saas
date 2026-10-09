import { useEffect, useState } from "react";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createOrder, getLandingPage } from "./api";
import { districts } from "./districts";
import { saveGuestOrder } from "./guestOrders";

const money = value => `৳${Number(value || 0).toLocaleString("en-BD")}`;

function LegacyLandingCheckout({ page, product }) {
  const [options, setOptions] = useState({});
  const [district, setDistrict] = useState("Dhaka");
  const [deliveryZone, setDeliveryZone] = useState("inside-dhaka");
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const hasPhysicalItem = product.type !== "virtual";
  const deliveryFee = hasPhysicalItem ? deliveryZone === "inside-dhaka" ? 80 : 150 : 0;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await createOrder({
        customer: form.get("name"),
        phone: form.get("phone"),
        address: form.get("address"),
        district: hasPhysicalItem ? district : undefined,
        deliveryZone: hasPhysicalItem ? deliveryZone : undefined,
        landingPageId: page._id,
        source: "landing-page",
        items: [{ productId: product._id, quantity: 1, options }]
      });
      setOrder(result);
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  if (order) return <div className="landing-order-success"><span><Check/></span><h3>Order received</h3><p>Order {order.orderNumber}. We’ll contact you to confirm.</p><strong>{money(order.total)}</strong></div>;

  return <form className="landing-order-form" onSubmit={submit} id="landing-checkout"><span className="eyebrow">FAST CHECKOUT</span><h2>Order {product.name}</h2><p className="landing-order-price">{money(product.price)}</p>
    {product.variants?.map(variant => <label className="landing-order-field" key={variant.label}>{variant.label}<select required value={options[variant.label] || ""} onChange={event => setOptions(current => ({ ...current, [variant.label]: event.target.value }))}><option value="">Choose {variant.label.toLowerCase()}</option>{variant.options.map(option => <option key={option}>{option}</option>)}</select></label>)}
    <label className="landing-order-field">Full name<input name="name" autoComplete="name" required/></label>
    <label className="landing-order-field">Phone number<input name="phone" type="tel" autoComplete="tel" required/></label>
    <label className="landing-order-field">Delivery address<textarea name="address" rows="2" autoComplete="street-address" required/></label>
    {hasPhysicalItem && <><label className="landing-order-field">District<select value={district} onChange={event => { const value = event.target.value; setDistrict(value); setDeliveryZone(value === "Dhaka" ? "inside-dhaka" : "outside-dhaka"); }} required>{districts.map(name => <option key={name}>{name}</option>)}</select></label><fieldset className="landing-delivery-choice"><legend>Delivery option</legend><label><input type="radio" name="deliveryZone" checked={deliveryZone === "inside-dhaka"} onChange={() => setDeliveryZone("inside-dhaka")}/><span>Inside Dhaka <b>৳80</b></span></label><label><input type="radio" name="deliveryZone" checked={deliveryZone === "outside-dhaka"} onChange={() => setDeliveryZone("outside-dhaka")}/><span>Outside Dhaka <b>৳150</b></span></label></fieldset></>}
    <div className="landing-order-total"><span>Product</span><b>{money(product.price)}</b></div>{hasPhysicalItem && <div className="landing-order-total"><span>Delivery</span><b>{money(deliveryFee)}</b></div>}<div className="landing-order-total grand"><strong>Total</strong><strong>{money(product.price + deliveryFee)}</strong></div>{error && <p className="form-error">{error}</p>}<button className="landing-order-submit" disabled={submitting}><ShoppingBag size={16}/>{submitting ? "Placing order…" : "Place order"}</button><small>Cash on delivery available</small>
  </form>;
}

function LandingCheckout({ page, product }) {
  const navigate = useNavigate();
  const [options, setOptions] = useState({});
  const [district, setDistrict] = useState("Dhaka");
  const [deliveryZone, setDeliveryZone] = useState("inside-dhaka");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasPhysicalItem = product.type !== "virtual";
  const deliveryFee = hasPhysicalItem ? deliveryZone === "inside-dhaka" ? 80 : 150 : 0;

  async function submit(event) {
    event.preventDefault(); setError(""); setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const order = await createOrder({
        customer: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email"),
        address: form.get("address"),
        district: hasPhysicalItem ? district : undefined,
        deliveryZone: hasPhysicalItem ? deliveryZone : undefined,
        landingPageId: page._id,
        items: [{ productId: product._id, quantity: 1, options }]
      });
      saveGuestOrder(order);
      navigate(`/invoice/${encodeURIComponent(order.orderNumber)}`, { state: { order } });
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  return <form className="landing-order-form" onSubmit={submit} id="landing-checkout"><span className="eyebrow">FAST CHECKOUT</span><h2>Order {product.name}</h2><p className="landing-order-price">{money(product.price)}</p>
    {product.variants?.map(variant => <label className="landing-order-field" key={variant.label}>{variant.label}<select required value={options[variant.label] || ""} onChange={event => setOptions(current => ({ ...current, [variant.label]: event.target.value }))}><option value="">Choose {variant.label.toLowerCase()}</option>{variant.options.map(option => <option key={option}>{option}</option>)}</select></label>)}
    <label className="landing-order-field">Full name<input name="name" autoComplete="name" required/></label>
    <label className="landing-order-field">Phone number<input name="phone" type="tel" autoComplete="tel" required/></label>
    <label className="landing-order-field">Email for receipt (optional)<input name="email" type="email" autoComplete="email"/></label>
    <label className="landing-order-field">Delivery address<textarea name="address" rows="2" autoComplete="street-address" required/></label>
    {hasPhysicalItem && <><label className="landing-order-field">District<select value={district} onChange={event => { const value = event.target.value; setDistrict(value); setDeliveryZone(value === "Dhaka" ? "inside-dhaka" : "outside-dhaka"); }} required>{districts.map(name => <option key={name}>{name}</option>)}</select></label><fieldset className="landing-delivery-choice"><legend>Delivery option</legend><label><input type="radio" name="deliveryZone" checked={deliveryZone === "inside-dhaka"} onChange={() => setDeliveryZone("inside-dhaka")}/><span>Inside Dhaka <b>৳80</b></span></label><label><input type="radio" name="deliveryZone" checked={deliveryZone === "outside-dhaka"} onChange={() => setDeliveryZone("outside-dhaka")}/><span>Outside Dhaka <b>৳150</b></span></label></fieldset></>}
    <div className="landing-order-total"><span>Product</span><b>{money(product.price)}</b></div>{hasPhysicalItem && <div className="landing-order-total"><span>Delivery</span><b>{money(deliveryFee)}</b></div>}<div className="landing-order-total grand"><strong>Total</strong><strong>{money(product.price + deliveryFee)}</strong></div>{error && <p className="form-error">{error}</p>}<button className="landing-order-submit" disabled={submitting}><ShoppingBag size={16}/>{submitting ? "Placing order…" : "Place order"}</button><small>Cash on delivery available</small>
  </form>;
}

export default function LandingPagePublic() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getLandingPage(slug).then(setPage).catch(requestError => setError(requestError.message)); }, [slug]);
  if (error) return <main className="landing-public-error"><h1>Page unavailable</h1><p>{error}</p><Link to="/shop">Browse the shop</Link></main>;
  if (!page) return <main className="landing-public-loading">Loading page…</main>;
  const product = page.productId;
  const hero = page.blocks?.find(block => block.type === "hero");
  return <main className="landing-public-page"><header className="landing-public-nav"><Link className="public-brand" to="/"><span className="public-brand-mark">H</span><span>H2R <small>ONLINE</small></span></Link><Link to="/shop">Shop all products <ArrowRight size={14}/></Link></header><section className="landing-public-hero"><img src={product.image} alt={product.name}/><div className="landing-public-hero-copy"><span className="eyebrow">FEATURED PRODUCT</span><h1>{hero?.props?.title || page.title}</h1><p>{hero?.props?.subtitle || product.description}</p><strong>{money(product.price)}</strong><a href="#landing-checkout">Order now <ArrowRight size={15}/></a></div></section><section className="landing-public-product"><div className="landing-public-product-image"><img src={product.image} alt={product.name}/></div><div><span className="eyebrow">{product.category || "H2R ONLINE"}</span><h2>{product.name}</h2><strong>{money(product.price)}</strong><p>{product.description}</p>{product.variants?.map(variant => <p className="landing-public-variant" key={variant.label}><b>{variant.label}</b><span>{variant.options.join(" · ")}</span></p>)}</div></section>{page.video?.url && <section className="landing-public-video"><video src={page.video.url} controls preload="metadata" aria-label={`${page.title} product video`}/></section>}{page.blocks?.filter(block => !["hero", "video", "checkout"].includes(block.type)).map((block, index) => <section className={`landing-public-block ${block.type}`} key={`${block.type}-${index}`}><span className="eyebrow">{block.type === "benefits" ? "THE DETAILS" : "FROM OUR CUSTOMERS"}</span><h2>{block.props?.title}</h2><p>{block.props?.subtitle}</p></section>)}<section className="landing-public-checkout"><div className="landing-checkout-intro"><span className="eyebrow">READY WHEN YOU ARE</span><h2>Get yours today.</h2><p>Secure your order in a few quick steps. We’ll call to confirm delivery.</p></div><LandingCheckout page={page} product={product}/></section><footer className="landing-public-footer"><Link to="/">H2R Online</Link><span>Delivery throughout Bangladesh</span></footer></main>;
}
