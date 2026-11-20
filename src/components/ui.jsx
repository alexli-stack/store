import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { img, money } from "../lib.js";
import { useCart } from "../cart.jsx";

export const Link = ({ to, href, children, ...rest }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" {...rest}>{children}</a>
  ) : (
    <a href={`#${to}`} {...rest}>{children}</a>
  );

export const Icon = ({ name, size = 22 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
    cart: <><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7" /><circle cx="9.5" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />,
    truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></>,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />,
    refresh: <><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" /><path d="M20 4v5h-5M4 20v-5h5" /></>,
    headset: <><path d="M5 13a7 7 0 0 1 14 0" /><rect x="3.5" y="13" width="4" height="6" rx="1.5" /><rect x="16.5" y="13" width="4" height="6" rx="1.5" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
    filter: <path d="M4 6h16l-6 7v5l-4 2v-7z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
    pin: <><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
    phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" />,
    sparkle: <path d="M10 3.5 11.6 8a3 3 0 0 0 1.9 1.9L18 11.5l-4.5 1.6a3 3 0 0 0-1.9 1.9L10 19.5l-1.6-4.5a3 3 0 0 0-1.9-1.9L2 11.5l4.5-1.6A3 3 0 0 0 8.4 8zM18 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" stroke="none" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    quote: <><path d="M5 5h14v10H9l-4 4z" /><path d="M9 9.5h6M9 12h4" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>,
    globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.6 2.4 3.9 5.2 3.9 8.5s-1.3 6.1-3.9 8.5c-2.6-2.4-3.9-5.2-3.9-8.5s1.3-6.1 3.9-8.5z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

/** DJI writes prices as "$439.00 USD" on product pages and "USD $439" on cards and in the cart. */
export const usd = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Price({ product, variant, from = false }) {
  const v = variant || product;
  return (
    <span className="price">
      {from && product.priceVaries && "From "}
      <span>{usd(v.price)} USD</span>
      {v.compareAt && <s>{usd(v.compareAt)} USD</s>}
    </span>
  );
}

export function QtyStepper({ value, onChange, min = 0 }) {
  return (
    <span className="qty">
      <button type="button" aria-label={t("Decrease quantity")} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label={t("Increase quantity")} onClick={() => onChange(value + 1)}>+</button>
    </span>
  );
}

const LABELS = { rotary: "Rotary attachment", fume: "Fume extraction", optics: "Optics", cooling: "Water chiller", expansion: "Expansion", air: "Air assist", software: "Software & training", acrylic: "Acrylic sheets", leatherette: "Leatherette" };
export const productLabel = (p) => (p.kind === "machine" ? `${p.seriesName.replace(" Series", "")} laser` : LABELS[p.category] || "Accessory");

/** Home product card (DJI "figma-product-card"): gray media, series line, two-line name, "From USD $x". */
export function ProductCard({ product }) {
  return (
    <article className="pcard">
      <Link to={`/products/${product.handle}`} className="pcard-media"><img src={img(product.images[0], 500)} alt="" loading="lazy" /></Link>
      <div className="pcard-body">
        <p className="pcard-series">{product.compareAt && <span>Sale · </span>}{productLabel(product)}</p>
        <h3><Link to={`/products/${product.handle}`}>{product.name}</Link></h3>
        <span className="pcard-price"><strong>{product.priceVaries ? "From " : ""}USD {usd(product.price)}</strong></span>
      </div>
    </article>
  );
}

/** Collection card (DJI "collection-v2 card"): flat gray tile, title, "USD $x", round Shop → action. */
/** Listing card. Accessories and materials get a direct Add to Cart button (stays on the listing);
    products with several options send the shopper to the product page to choose. Machines keep the DJI hover arrow. */
export function CollectionCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const quick = product.kind !== "machine";
  const single = product.variants.length === 1;
  const addNow = () => {
    add(product.handle, product.variants[0].id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <article className={`ccard${quick ? " quick" : ""}`}>
      <Link to={`/products/${product.handle}`} className="ccard-link">
        {product.compareAt && <span className="ccard-tag">{t("Sale")}</span>}
        {!product.available && <span className="ccard-tag muted">{t("Sold out")}</span>}
        <span className="ccard-media"><img src={img(product.images[0], 700)} alt="" loading="lazy" /></span>
        <span className="ccard-content">
          <span className="ccard-details">
            <span className="ccard-title">{product.name}</span>
            <span className="ccard-price">{product.priceVaries && "From "}USD <b>{money(product.price)}</b>{product.compareAt && <s>USD {money(product.compareAt)}</s>}</span>
          </span>
          {!quick && <span className="ccard-action"><span>{t("Shop")}</span><Icon name="arrow" size={18} /></span>}
        </span>
      </Link>
      {quick && (
        <div className="ccard-buy">
          {!product.available ? (
            <button type="button" disabled>{t("Sold Out")}</button>
          ) : single ? (
            <button type="button" className={added ? "added" : ""} onClick={addNow} aria-live="polite">
              <Icon name={added ? "check" : "cart"} size={18} />{added ? "Added to Cart" : "Add to Cart"}
            </button>
          ) : (
            <Link to={`/products/${product.handle}`}>{t("Select Options")}<Icon name="arrow" size={16} /></Link>
          )}
        </div>
      )}
    </article>
  );
}

export function Countdown({ endsAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, new Date(endsAt).getTime() - now);
  const parts = [
    ["Days", Math.floor(left / 864e5)], ["Hours", Math.floor(left / 36e5) % 24],
    ["Minutes", Math.floor(left / 6e4) % 60], ["Seconds", Math.floor(left / 1e3) % 60],
  ];
  return (
    <div className="countdown" role="timer">
      {parts.map(([label, n]) => (
        <span key={label}><strong>{String(n).padStart(2, "0")}</strong><small>{t(label)}</small></span>
      ))}
    </div>
  );
}

/** Horizontal slider with round overlay arrows (DJI "slider-shell"). */
export function Rail({ children, label, className = "" }) {
  const scroll = (e, dir) => {
    const track = e.currentTarget.parentElement.querySelector(".rail-track");
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className={`rail ${className}`} aria-label={label}>
      <button type="button" className="slider-arrow prev" aria-label={t("Previous")} onClick={(e) => scroll(e, -1)}>‹</button>
      <div className="rail-track">{children}</div>
      <button type="button" className="slider-arrow next" aria-label={t("Next")} onClick={(e) => scroll(e, 1)}>›</button>
    </div>
  );
}

/** Add-to-cart button that stays on the page. One option: adds straight away. Several options (power, bundle, size…): opens a
    small list above (or below) the button so the shopper picks one first. Confirms with "Added" for a moment. */
export function AddButton({ product, className = "", drop = "up", iconSize = 16 }) {
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const box = useRef(null);
  const many = product.variants.length > 1;
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    const key = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", away); window.removeEventListener("keydown", key); };
  }, [open]);
  const put = (v) => {
    add(product.handle, v.id, 1);
    setOpen(false); setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const click = () => (many ? setOpen((o) => !o) : put(product.variants.find((v) => v.available) || product.variants[0]));
  return (
    <span className={`addbtn${open ? " open" : ""} ${drop}`} ref={box}>
      <button type="button" className={`${className}${added ? " added" : ""}`} disabled={!product.available} onClick={click} aria-haspopup={many ? "listbox" : undefined} aria-expanded={many ? open : undefined} aria-live="polite">
        {added ? <><Icon name="check" size={iconSize} />{t("Added")}</> : !product.available ? t("Sold Out") : <><Icon name="cart" size={iconSize} />{t("Add to cart")}</>}
      </button>
      {open && (
        <span className="addbtn-menu" role="listbox" aria-label={t("Choose an option")}>
          <b>{t("Choose an option")}</b>
          {product.variants.map((v) => (
            <button key={v.id} type="button" role="option" aria-selected="false" disabled={!v.available} onClick={() => put(v)}>
              <span>{v.title || product.name}</span>
              <em>{v.available ? <>{usd(v.price).replace(".00", "")}{v.compareAt > v.price && <s>{usd(v.compareAt).replace(".00", "")}</s>}</> : t("Sold out")}</em>
              {v.available && <i aria-hidden="true"><Icon name="cart" size={15} /></i>}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

/** Lets a horizontally scrolling row be dragged with the mouse; with `wheel` the mouse wheel also moves it sideways while it can.
    A drag of more than a few pixels does not count as a click on the item under the pointer. */
export function useDragScroll({ wheel = false } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let down = false, moved = false, startX = 0, startLeft = 0;
    const onDown = (e) => { if (e.button !== 0) return; down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft; };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; el.classList.add("dragging"); }
      if (moved) { el.scrollLeft = startLeft - dx; e.preventDefault(); }
    };
    const onUp = () => { down = false; setTimeout(() => el.classList.remove("dragging"), 0); };
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || (e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("click", onClick, true);
    if (wheel) el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("click", onClick, true);
      if (wheel) el.removeEventListener("wheel", onWheel);
    };
  }, [wheel]);
  return ref;
}
