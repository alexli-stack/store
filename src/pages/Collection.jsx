import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { img, money, products } from "../lib.js";
import { useCart } from "../cart.jsx";
import { collections, newHandles } from "../data/site.js";
import { Icon, Link } from "../components/ui.jsx";

/* Layout, sizes and type follow the Insta360 Store listing page (store.insta360.com/accessory, measured 2026-11-17 at 1440):
   gray page #F8F9FC → sticky white category strip (124×148 tiles, 80px image) → 240px filter column (20/28 bold head, count badge,
   Reset, 16/22 bold groups with 16px checkboxes) + 3-column grid of white cards 316×395, radius 16, 191px image,
   18/24 title, 14px price and a 36px dark pill button. */

const SORTS = {
  Recommended: null,
  "Price: Low to High": (a, b) => a.price - b.price,
  "Price: High to Low": (a, b) => b.price - a.price,
  "Name: A–Z": (a, b) => a.name.localeCompare(b.name),
};
const TREE = [
  ["Laser Machines", "machines", [["XRF Series", "xrf-series"], ["Cobra Series", "cobra-series"], ["Hydra Gen2", "hydra-gen2"], ["VertiGo", "vertigo"], ["Previous Generation", "previous-generation"]]],
  ["Accessories", "accessories", [["Rotary Attachments", "rotary"], ["Fume Extractors", "fume"], ["Lens, Mirrors & Tubes", "optics"], ["Chillers", "cooling"], ["Expansion", "expansion"], ["Software & Training", "software"]]],
  ["Materials", "materials", [["Acrylic Sheets", "acrylic"], ["Leatherette", "leatherette"]]],
];
const thumb = (h) => products.find(collections[h]?.filter || (() => false))?.images[0];

function Card({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const machine = product.kind === "machine";
  const single = product.variants.length === 1;
  const to = `/products/${product.handle}`;
  const addNow = () => {
    add(product.handle, product.variants[0].id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <article className="il-card">
      <Link to={to} className="il-card-media" tabIndex={-1} aria-hidden="true"><img src={img(product.images[0], 500)} alt="" loading="lazy" /></Link>
      <p className="il-card-tag">
        {!product.available ? <span>{t("Out of stock")}</span> : newHandles.includes(product.handle) ? <b>{t("New")}</b> : product.compareAt ? <b>{t("Save")} {money(product.compareAt - product.price)}</b> : null}
      </p>
      <h3><Link to={to}>{product.name}</Link></h3>
      <div className="il-card-foot">
        <span className="il-price">{product.priceVaries && `${t("From")} `}{money(product.price)}{product.compareAt && <s>{money(product.compareAt)}</s>}</span>
        {!product.available ? (
          <button type="button" className="il-pill muted" disabled>{t("Notify me")}</button>
        ) : machine || !single ? (
          <Link to={to} className="il-pill">{machine ? t("Buy now") : t("Select options")}</Link>
        ) : (
          <button type="button" className={`il-pill${added ? " added" : ""}`} onClick={addNow} aria-live="polite">{added ? t("Added") : t("Add to cart")}</button>
        )}
      </div>
    </article>
  );
}

function Group({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="il-group">
      <button type="button" className="il-group-head" aria-expanded={open} onClick={() => setOpen(!open)}><span>{t(title)}</span><i aria-hidden="true">{open ? "–" : "+"}</i></button>
      {open && <div className="il-group-body">{children}</div>}
    </div>
  );
}

export default function Collection({ handle, search }) {
  const col = search != null ? { title: `Results for “${search}”`, intro: "", filter: (p) => `${p.name} ${p.title} ${p.tagline}`.toLowerCase().includes(search.toLowerCase()) } : collections[handle];
  const [sort, setSort] = useState("Recommended");
  const [onlySale, setOnlySale] = useState(false);
  const [onlyStock, setOnlyStock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const group = TREE.find(([, h, kids]) => h === handle || kids.some(([, k]) => k === handle)) || TREE[0];
  const list = useMemo(() => {
    if (!col) return [];
    let l = products.filter(col.filter);
    if (onlySale) l = l.filter((p) => p.compareAt);
    if (onlyStock) l = l.filter((p) => p.available);
    return SORTS[sort] ? [...l].sort(SORTS[sort]) : l;
  }, [col, sort, onlySale, onlyStock]);
  if (!col) return <div className="container section-pad"><h1>{t("Collection not found")}</h1><Link to="/">{t("Back to store")}</Link></div>;
  const reset = () => { setOnlySale(false); setOnlyStock(false); };
  const count = Number(onlySale) + Number(onlyStock);
  const strip = [["All", group[1]], ...group[2]];
  return (
    <section className="il">
      <h1 className="il-sr">{col.title}</h1>
      <nav className="il-strip" aria-label={t("Categories")}>
        <div>
          {strip.map(([label, h]) => (
            <Link key={h} to={`/collections/${h}`} className={h === handle ? "on" : ""}>
              <span><img src={img(thumb(h), 200)} alt="" loading="lazy" /></span>
              <b>{t(label)}</b>
            </Link>
          ))}
        </div>
      </nav>
      <div className="il-body">
        <aside className={`il-filter${filterOpen ? " open" : ""}`}>
          <div className="il-filter-head">
            <h2>{t("Filter")}</h2><em>{count}</em>
            <button type="button" onClick={reset}>{t("Reset")}</button>
            <button type="button" className="icon-btn only-mobile" aria-label={t("Close filter")} onClick={() => setFilterOpen(false)}><Icon name="close" /></button>
          </div>
          <Group title={t("Offers")}>
            <label><input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} /><span>{t("Sale")}</span></label>
            <label><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} /><span>{t("In stock")}</span></label>
          </Group>
          <Group title={t("Category")}>
            {TREE.map(([label, h]) => <Link key={h} to={`/collections/${h}`} className={h === group[1] ? "on" : ""}>{t(label)}</Link>)}
          </Group>
          <Group title={group[0]}>
            {group[2].map(([label, h]) => <Link key={h} to={`/collections/${h}`} className={h === handle ? "on" : ""}>{t(label)}</Link>)}
          </Group>
          <button type="button" className="il-pill only-mobile" onClick={() => setFilterOpen(false)}>{t("Show")} {list.length} {t("items")}</button>
        </aside>
        <div className="il-main">
          <div className="il-toolbar">
            <p>{list.length} {t("items found")}{search != null && ` for “${search}”`}</p>
            <button type="button" className="il-filter-open only-mobile" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /> {t("Filter")}</button>
            <label><span>{t("Sort by:")}</span><select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></label>
          </div>
          {list.length ? <div className="il-grid">{list.map((p) => <Card key={p.handle} product={p} />)}</div> : <p className="il-empty">{t("No products match.")}</p>}
        </div>
      </div>
    </section>
  );
}
