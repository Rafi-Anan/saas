import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { ShoppingCart, LayoutDashboard, Package, Users, BarChart3, PanelsTopLeft } from "lucide-react";
import { getProduct, getProducts } from "./api";

function Header(){
  return <header><div className="container nav"><Link className="brand" to="/">H2R Commerce</Link><nav><Link to="/shop">Shop</Link><Link to="/landing/demo">Landing</Link><Link to="/admin">Admin</Link></nav><Link className="btn" to="/cart"><ShoppingCart size={17}/> Cart</Link></div></header>;
}

function ProductCard({p}){
  return <article className="card product"><img src={p.image} alt={p.name}/><div className="pad"><small>{p.category}</small><h3>{p.name}</h3><strong>৳{p.price.toLocaleString()}</strong>{p.compareAt&&<del>৳{p.compareAt.toLocaleString()}</del>}<Link className="btn primary full" to={`/product/${p.slug}`}>View product</Link></div></article>;
}

function Home(){
  const [products,setProducts]=useState([]);
  useEffect(()=>{getProducts().then(setProducts).catch(console.error)},[]);
  return <><Header/><section className="hero"><div className="container hero-grid"><div><span className="pill">MERN Commerce Starter</span><h1>Launch your online store faster.</h1><p>A scalable foundation for products, COD orders, customers, reports and landing-page commerce.</p><div className="actions"><Link className="btn light" to="/shop">Start shopping</Link><Link className="btn outline" to="/admin">Open admin</Link></div></div><div className="dashboard-card"><small>Today's sales</small><b>৳48,920</b><span>+18.4%</span><div className="mini-grid"><div><b>32</b><small>Orders</small></div><div><b>26</b><small>Customers</small></div><div><b>81%</b><small>Success</small></div></div></div></div></section><section className="container section"><div className="section-head"><h2>Featured products</h2><Link to="/shop">View all</Link></div><div className="grid">{products.map(p=><ProductCard key={p._id} p={p}/>)}</div></section></>;
}

function Shop(){
  const [products,setProducts]=useState([]);
  useEffect(()=>{getProducts().then(setProducts)},[]);
  return <><Header/><main className="container section"><h1>Shop</h1><p className="muted">Browse simple and variable products.</p><div className="filters"><button className="btn">All</button><button className="btn">Shoes</button><button className="btn">Accessories</button><button className="btn">Grocery</button></div><div className="grid">{products.map(p=><ProductCard key={p._id} p={p}/>)}</div></main></>;
}

function ProductPage(){
  const slug=location.pathname.split("/").pop();
  const [p,setP]=useState(null);
  useEffect(()=>{getProduct(slug).then(setP)},[slug]);
  if(!p) return <><Header/><main className="container section">Loading...</main></>;
  return <><Header/><main className="container section two"><img className="detail-img" src={p.image}/><div><small>{p.category}</small><h1>{p.name}</h1><div className="price">৳{p.price.toLocaleString()}</div>{p.compareAt&&<del>৳{p.compareAt.toLocaleString()}</del>}<p className="muted">Variable product options can be selected here.</p>{p.variants?.map(v=><div className="variant" key={v.label}><b>{v.label}</b><div>{v.options.map(o=><button className="btn" key={o}>{o}</button>)}</div></div>)}<Link className="btn primary" to="/checkout">Buy now</Link></div></main></>;
}

function Cart(){return <><Header/><main className="container section"><h1>Cart</h1><div className="card pad narrow"><div className="row"><span>Premium Running Shoe × 1</span><b>৳2,490</b></div><hr/><div className="row"><b>Total</b><b>৳2,490</b></div><Link className="btn primary full" to="/checkout">Proceed to checkout</Link></div></main></>}

function Checkout(){
  const [done,setDone]=useState(false);
  async function submit(e){e.preventDefault();const f=new FormData(e.currentTarget);const data={customer:f.get("name"),phone:f.get("phone"),address:f.get("address"),total:2490,payment:f.get("payment"),items:[{name:"Premium Running Shoe",quantity:1,price:2490}]};await (await import("./api")).createOrder(data);setDone(true);}
  return <><Header/><main className="container section"><h1>Checkout</h1>{done?<div className="card pad"><h2>Order received ✓</h2><p>Your order has been sent to the store.</p><Link className="btn primary" to="/">Back to store</Link></div>:<div className="two"><form className="card pad form" onSubmit={submit}><input name="name" placeholder="Full name" required/><input name="phone" placeholder="Phone number" required/><textarea name="address" placeholder="Delivery address" required/><select name="payment"><option>COD</option><option>Prepaid</option></select><button className="btn primary">Place order</button></form><div className="card pad"><h3>Order summary</h3><div className="row"><span>Premium Running Shoe</span><b>৳2,490</b></div></div></div>}</main></>;
}

function Landing(){return <main className="landing"><section><span className="pill">Limited offer</span><h1>Premium Running Shoe</h1><p>Comfort, grip and everyday performance.</p><div className="price">৳2,490</div><Link className="btn light" to="/checkout">Order now</Link></section><div className="landing-benefits container"><div className="card pad"><b>Fast delivery</b><p>Bangladesh-ready architecture.</p></div><div className="card pad"><b>Size selection</b><p>Variable products supported.</p></div><div className="card pad"><b>Cash on delivery</b><p>COD and prepaid checkout.</p></div></div></main>}

function AdminLayout({children}){return <div className="admin"><aside><Link className="brand white" to="/">H2R Commerce</Link><small>Admin starter</small><Link to="/admin"><LayoutDashboard/>Dashboard</Link><Link to="/admin/products"><Package/>Products</Link><Link to="/admin/orders"><Package/>Orders</Link><Link to="/admin/customers"><Users/>Customers</Link><Link to="/admin/reports"><BarChart3/>Reports</Link><Link to="/admin/landing-pages"><PanelsTopLeft/>Landing Pages</Link></aside><div className="admin-main"><header className="admin-header"><b>Store Admin</b><Link to="/">View store</Link></header>{children}</div></div>}

function Admin(){
  return <AdminLayout><main className="admin-content"><h1>Dashboard</h1><p className="muted">MERN starter analytics.</p><div className="stats">{[["Revenue","৳48,920"],["Orders","32"],["Customers","26"],["Success rate","81%"]].map(x=><div className="card pad" key={x[0]}><small>{x[0]}</small><h2>{x[1]}</h2></div>)}</div><div className="card pad"><h3>Next production modules</h3><p className="muted">Authentication, RBAC, MongoDB-backed admin CRUD, courier/payment adapters, IP risk controls and the full visual landing-page builder.</p></div></main></AdminLayout>
}

function AdminPage({title,children}){return <AdminLayout><main className="admin-content"><h1>{title}</h1>{children||<div className="card pad"><p className="muted">This module is scaffolded and ready for API-backed CRUD.</p></div>}</main></AdminLayout>}

export default function App(){
  return <Routes>
    <Route path="/" element={<Home/>}/><Route path="/shop" element={<Shop/>}/><Route path="/product/:slug" element={<ProductPage/>}/><Route path="/cart" element={<Cart/>}/><Route path="/checkout" element={<Checkout/>}/><Route path="/landing/demo" element={<Landing/>}/>
    <Route path="/admin" element={<Admin/>}/><Route path="/admin/products" element={<AdminPage title="Products"/>}/><Route path="/admin/orders" element={<AdminPage title="Orders"/>}/><Route path="/admin/customers" element={<AdminPage title="Customers"/>}/><Route path="/admin/reports" element={<AdminPage title="Reports"/>}/><Route path="/admin/landing-pages" element={<AdminPage title="Landing Pages"/>}/>
  </Routes>;
}
