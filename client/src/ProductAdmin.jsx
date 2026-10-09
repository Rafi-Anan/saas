import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Package, Trash2, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createProduct, deleteProduct, getProducts, uploadProductImages } from "./api";

const money = value => `৳${Number(value || 0).toLocaleString("en-BD")}`;
const splitValues = value => [...new Set(String(value || "").split(",").map(item => item.trim()).filter(Boolean))];

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [type, setType] = useState("simple");
  const [imageSource, setImageSource] = useState("device");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [files, setFiles] = useState([]);

  async function refresh() {
    try { setProducts(await getProducts()); setError(""); }
    catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { refresh(); }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const slug = String(form.get("slug") || "").trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      let image;
      let gallery = [];
      if (imageSource === "device") {
        if (!files.length) throw new Error("Choose at least one image from this device");
        const uploaded = await uploadProductImages(files);
        image = uploaded[0].url;
        gallery = uploaded.slice(1).map(item => ({ url: item.url, type: "image", alt: name }));
      } else {
        image = String(form.get("primaryImage") || "").trim();
        const urls = String(form.get("galleryUrls") || "").split(/\r?\n/).map(url => url.trim()).filter(Boolean);
        if (urls.some(url => !/^https?:\/\//i.test(url))) throw new Error("Each additional image needs a valid HTTP or HTTPS URL");
        gallery = urls.map(url => ({ url, type: "image", alt: name }));
      }

      const colors = splitValues(form.get("colors"));
      const sizes = splitValues(form.get("sizes"));
      const data = {
        name,
        slug,
        description: String(form.get("description") || "").trim(),
        category: String(form.get("category") || "").trim(),
        type,
        price: Number(form.get("price")),
        compareAt: Number(form.get("compareAt")) || undefined,
        stock: type === "virtual" ? 0 : Number(form.get("stock") || 0),
        image,
        media: gallery,
        tags: splitValues(form.get("tags")),
        variants: type === "variable" ? [{ label: "Color", options: colors }, { label: "Size", options: sizes }] : [],
        status: "active"
      };
      await createProduct(data);
      formElement.reset();
      setFiles([]);
      setType("simple");
      setImageSource("device");
      setNotice("Product created and published to the storefront.");
      await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  async function remove(product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try { await deleteProduct(product._id); await refresh(); }
    catch (requestError) { setError(requestError.message); }
  }

  return <div className="product-admin-screen"><header className="product-admin-top"><Link to="/admin"><ArrowLeft size={16}/> Admin dashboard</Link><span>CATALOGUE / PRODUCTS</span></header><main className="product-admin-content"><div className="product-admin-heading"><div><span className="eyebrow">PRODUCT CATALOGUE</span><h1>Add a product</h1><p>Set product details, options, images, and search tags.</p></div><span className="product-admin-count">{products.length} products</span></div>{error && <p className="notice">{error}</p>}{notice && <p className="register-success">{notice}</p>}
      <form className="product-editor" onSubmit={submit}>
        <section className="product-editor-section"><div className="product-editor-title"><span className="editor-icon"><Package size={17}/></span><div><h2>Product details</h2><p>These details appear in your public shop.</p></div></div><div className="product-editor-grid"><label className="editor-wide">Product title<input name="name" required maxLength="160" placeholder="e.g. Everyday canvas tote"/></label><label>URL slug<input name="slug" placeholder="Generated from title"/></label><label>Category<input name="category" placeholder="e.g. Accessories"/></label><label>Price (BDT)<input name="price" type="number" min="0" step="0.01" required/></label><label>Compare-at price<input name="compareAt" type="number" min="0" step="0.01"/></label><label className="editor-wide">Description<textarea name="description" rows="4" placeholder="Describe the product"/></label><label className="editor-wide">SEO tags<input name="tags" placeholder="canvas tote, reusable bag, everyday carry"/><small>Separate tags with commas. Used as product search metadata.</small></label></div></section>

        <section className="product-editor-section"><div className="product-editor-title"><span className="editor-icon"><Package size={17}/></span><div><h2>Product type</h2><p>Choose how this product is sold.</p></div></div><div className="product-type-picker"><label className={type === "simple" ? "chosen" : ""}><input type="radio" name="productType" value="simple" checked={type === "simple"} onChange={() => setType("simple")}/><span><b>Simple</b><small>One product, no selectable options</small></span></label><label className={type === "virtual" ? "chosen" : ""}><input type="radio" name="productType" value="virtual" checked={type === "virtual"} onChange={() => setType("virtual")}/><span><b>Virtual</b><small>Digital or non-shipping item</small></span></label><label className={type === "variable" ? "chosen" : ""}><input type="radio" name="productType" value="variable" checked={type === "variable"} onChange={() => setType("variable")}/><span><b>Variable</b><small>Customers choose color and size</small></span></label></div>{type === "variable" && <div className="product-editor-grid variation-fields"><label>Colors <span className="required-label">Required</span><input name="colors" required placeholder="Black, White, Olive"/></label><label>Sizes <span className="required-label">Required</span><input name="sizes" required placeholder="S, M, L, XL"/></label></div>}{type !== "virtual" && <label className="stock-field">Inventory quantity<input name="stock" type="number" min="0" step="1" defaultValue="0"/></label>}</section>

        <section className="product-editor-section"><div className="product-editor-title"><span className="editor-icon"><ImagePlus size={17}/></span><div><h2>Product images</h2><p>One cover image is required. Add up to seven more gallery images.</p></div></div><div className="image-source-toggle"><button type="button" className={imageSource === "device" ? "selected" : ""} onClick={() => setImageSource("device")}><Upload size={14}/> From this device</button><button type="button" className={imageSource === "url" ? "selected" : ""} onClick={() => setImageSource("url")}>Use image URLs</button></div>{imageSource === "device" ? <label className="device-upload"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple required onChange={event => setFiles(Array.from(event.target.files || []))}/><Upload size={21}/><b>{files.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "Choose product images"}</b><span>{files.length ? "The first image is the cover; the rest are gallery images." : "JPEG, PNG, WebP, or AVIF. Maximum 8 MB per image."}</span></label> : <div className="product-editor-grid"><label className="editor-wide">Primary image URL<input name="primaryImage" type="url" required placeholder="https://example.com/product.jpg"/></label><label className="editor-wide">Additional image URLs<textarea name="galleryUrls" rows="3" placeholder="One URL per line"/></label></div>}</section>

        <footer className="product-editor-footer"><span>Cover image, title, and price are required.</span><button className="admin-primary" disabled={saving}>{saving ? "Saving product…" : "Save product"}</button></footer>
      </form>

      <section className="product-admin-list"><div className="product-admin-list-head"><div><h2>Store products</h2><p>Products currently published to this store</p></div></div>{products.length ? products.map(product => <article className="product-admin-row" key={product._id}><img src={product.image} alt=""/><div className="product-admin-row-title"><b>{product.name}</b><small>{product.category || "Uncategorized"} · {product.type}</small>{product.tags?.length > 0 && <small>SEO: {product.tags.join(", ")}</small>}</div><strong>{money(product.price)}</strong><span>{product.type === "virtual" ? "Virtual" : `${product.stock ?? 0} in stock`}</span><div className="product-thumb-list">{(product.media || []).slice(1, 4).map(media => <img src={media.url} alt="" key={media.url}/>)}</div><button className="delete-product-button" aria-label={`Delete ${product.name}`} title="Delete product" onClick={() => remove(product)}><Trash2 size={15}/></button></article>) : <div className="product-admin-empty">No products yet. Add your first product above.</div>}</section>
    </main></div>;
}
