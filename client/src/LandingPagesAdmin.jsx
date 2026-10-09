import { useEffect, useState } from "react";
import { ArrowUpRight, GripVertical, Plus, Save, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { createLandingPage, getLandingPages, getProducts, updateLandingPage, uploadLandingVideo } from "./api";

const blockTypes = [
  ["hero", "Hero section"], ["benefits", "Product highlights"], ["video", "Video section"], ["quote", "Customer quote"], ["faq", "FAQ section"], ["checkout", "Product checkout"]
];
const initialBlocks = [
  { type: "hero", props: { title: "Your product story starts here", subtitle: "A focused page for the product you want to sell." } },
  { type: "benefits", props: { title: "Why customers choose it", subtitle: "Add the details that make this product special." } },
  { type: "checkout", props: { title: "Order yours today" } }
];
const slugify = value => String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function LandingPagesAdmin() {
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [productId, setProductId] = useState("");
  const [blocks, setBlocks] = useState(initialBlocks);
  const [videoSource, setVideoSource] = useState("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState(-1);

  async function refresh() {
    try {
      const [productList, pageList] = await Promise.all([getProducts(), getLandingPages()]);
      setProducts(productList);
      setPages(pageList);
      if (!productId && productList.length) setProductId(productList[0]._id);
      setError("");
    } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { refresh(); }, []);

  function resetEditor() {
    setPageId(""); setTitle(""); setSlug(""); setStatus("draft"); setBlocks(initialBlocks); setVideoUrl(""); setVideoFile(null); setVideoSource("url"); setNotice("");
    if (products.length) setProductId(products[0]._id);
  }

  function openPage(page) {
    setPageId(page._id); setTitle(page.title); setSlug(page.slug); setStatus(page.status); setProductId(String(page.productId?._id || page.productId)); setBlocks(page.blocks?.length ? page.blocks : initialBlocks);
    setVideoUrl(page.video?.source === "url" ? page.video.url : ""); setVideoFile(null); setVideoSource(page.video?.source || "url"); setNotice("");
  }

  function patchBlock(index, key, value) {
    setBlocks(current => current.map((block, position) => position === index ? { ...block, props: { ...block.props, [key]: value } } : block));
  }

  function addBlock(type) {
    const definition = blockTypes.find(([value]) => value === type);
    setBlocks(current => [...current, { type, props: { title: definition?.[1] || "New section", subtitle: "Add your content" } }]);
  }

  function dropBlock(targetIndex) {
    if (dragIndex < 0 || dragIndex === targetIndex) return;
    setBlocks(current => {
      const reordered = [...current];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
    setDragIndex(-1);
  }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      let video;
      if (videoSource === "url" && videoUrl.trim()) video = { url: videoUrl.trim(), source: "url" };
      if (videoSource === "device" && videoFile) video = { ...(await uploadLandingVideo(videoFile)), source: "device" };
      const data = { title: title.trim(), slug: slugify(slug || title), productId, blocks, status, video };
      const saved = pageId ? await updateLandingPage(pageId, data) : await createLandingPage(data);
      setPageId(saved._id); setTitle(saved.title); setSlug(saved.slug); setNotice(`Landing page ${saved.status === "published" ? "published" : "saved as a draft"}.`);
      const pageList = await getLandingPages(); setPages(pageList);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  const product = products.find(item => item._id === productId);
  return <div className="landing-admin"><div className="landing-admin-heading"><div><span className="eyebrow">CAMPAIGN PAGES</span><h2>Product landing pages</h2><p>Choose a store product, arrange page sections, and publish a dedicated checkout.</p></div><button type="button" className="admin-primary" onClick={resetEditor}><Plus size={15}/> New page</button></div>
    {error && <p className="notice">{error}</p>}
    <div className="landing-admin-layout"><aside className="landing-page-list"><div className="landing-page-list-title"><b>Your pages</b><span>{pages.length}</span></div>{pages.map(page => <button type="button" className={`landing-list-item ${pageId === page._id ? "active" : ""}`} onClick={() => openPage(page)} key={page._id}><span><b>{page.title}</b><small>/{page.slug}</small></span><i className={page.status === "published" ? "published" : ""}>{page.status}</i></button>)}{!pages.length && <p>No landing pages yet.</p>}</aside>

      <form className="landing-builder" onSubmit={submit}><div className="landing-builder-top"><div><label>Page title<input value={title} onChange={event => { setTitle(event.target.value); if (!slug || slug === slugify(title)) setSlug(slugify(event.target.value)); }} required maxLength="160" placeholder="Product campaign title"/></label><label>Page URL<input value={slug} onChange={event => setSlug(event.target.value)} required placeholder="product-campaign"/></label></div><span className={`landing-status ${status}`}>{status}</span></div>

        <section className="landing-editor-card"><div className="landing-card-heading"><div><h3>Featured product</h3><p>Product details and purchase options come from your catalogue.</p></div></div><label className="landing-product-select">Store product<select value={productId} onChange={event => setProductId(event.target.value)} required><option value="">Choose a product</option>{products.map(item => <option key={item._id} value={item._id}>{item.name} · ৳{Number(item.price).toLocaleString("en-BD")}</option>)}</select></label>{product && <div className="landing-selected-product"><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.type} · {product.category || "Uncategorized"}</small><strong>৳{Number(product.price).toLocaleString("en-BD")}{product.compareAt > product.price ? ` · Was ${Number(product.compareAt).toLocaleString("en-BD")}` : ""}</strong>{product.description && <small className="landing-product-description">{product.description}</small>}{product.variants?.map(variant => <small key={variant.label}>{variant.label}: {variant.options.join(", ")}</small>)}{product.tags?.length > 0 && <small>SEO tags: {product.tags.join(", ")}</small>}<small>{product.media?.length || 1} product image{(product.media?.length || 1) === 1 ? "" : "s"}</small></span></div>}</section>

        <section className="landing-editor-card"><div className="landing-card-heading"><div><h3>Video</h3><p>Optional campaign video. The rest of the layout is built with draggable sections.</p></div></div><div className="landing-media-tabs"><button type="button" className={videoSource === "url" ? "active" : ""} onClick={() => setVideoSource("url")}>Video URL</button><button type="button" className={videoSource === "device" ? "active" : ""} onClick={() => setVideoSource("device")}><Upload size={13}/> Upload video</button></div>{videoSource === "url" ? <label className="landing-field">Video URL<input type="url" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="https://…/campaign.mp4"/></label> : <label className="landing-video-upload"><input type="file" accept="video/mp4,video/webm" onChange={event => setVideoFile(event.target.files?.[0] || null)}/><Upload size={18}/><span>{videoFile?.name || "Choose MP4 or WebM video (max 50 MB)"}</span></label>}</section>

        <section className="landing-editor-card"><div className="landing-card-heading"><div><h3>Page sections</h3><p>Drag a section to change its order. Add sections from the menu.</p></div><label className="landing-add-section">Add section<select value="" onChange={event => { if (event.target.value) addBlock(event.target.value); }}><option value="">Choose section</option>{blockTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="landing-block-list">{blocks.map((block, index) => <article className={`landing-block-item ${dragIndex === index ? "dragging" : ""}`} key={`${block.type}-${index}`} draggable onDragStart={() => setDragIndex(index)} onDragOver={event => event.preventDefault()} onDrop={() => dropBlock(index)} onDragEnd={() => setDragIndex(-1)}><span className="drag-handle" title="Drag to reorder"><GripVertical size={17}/></span><div className="landing-block-edit"><div><b>{blockTypes.find(([type]) => type === block.type)?.[1] || block.type}</b><button type="button" aria-label="Remove section" onClick={() => setBlocks(current => current.filter((_, position) => position !== index))}><Trash2 size={14}/></button></div><input aria-label="Section heading" value={block.props?.title || ""} onChange={event => patchBlock(index, "title", event.target.value)} placeholder="Section heading"/>{block.type !== "checkout" && <textarea aria-label="Section text" value={block.props?.subtitle || ""} onChange={event => patchBlock(index, "subtitle", event.target.value)} rows="2" placeholder="Section copy"/>}</div></article>)}</div></section>

        {product && <section className="landing-live-preview"><span className="eyebrow">LIVE PRODUCT PREVIEW</span><img src={product.image} alt=""/><div><h3>{title || product.name}</h3><p>{product.name} · ৳{Number(product.price).toLocaleString("en-BD")}</p>{product.variants?.map(variant => <small key={variant.label}>{variant.label}: {variant.options.join(" · ")}</small>)}</div></section>}
        {error && <p className="notice">{error}</p>}{notice && <p className="register-success">{notice}</p>}
        <footer className="landing-builder-footer"><label>Page status<select value={status} onChange={event => setStatus(event.target.value)}><option value="draft">Save as draft</option><option value="published">Publish page</option></select></label><button className="admin-primary" disabled={saving || !products.length}>{saving ? "Saving…" : status === "published" ? "Publish landing page" : "Save draft"}<Save size={14}/></button></footer>
        {pageId && status === "published" && <Link className="landing-public-link" target="_blank" to={`/landing/${slug}`}><ArrowUpRight size={14}/> View published page</Link>}
      </form>
    </div>
  </div>;
}
