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

/* Icon set, redrawn on the 24px grid in one consistent outline style (1.75 stroke, round caps and joins).
   tone: a two-tone version for feature tiles; closed shapes get a soft tinted fill under the outline. */
const ICONS = {
  search: <><circle cx="11" cy="11" r="7.5" /><path d="m20.5 20.5-4.2-4.2" /></>,
  user: <><circle cx="12" cy="7.5" r="4" /><path d="M4.5 21v-1.5A4.5 4.5 0 0 1 9 15h6a4.5 4.5 0 0 1 4.5 4.5V21" /></>,
  cart: <><circle cx="8.5" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2.2l2.5 11.6a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.95-1.55L21.5 7H5.6" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9.5 16.5 4 11" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-7 7 7-7 7" />,
  trash: <><path d="M3.5 6h17M18.5 6v13.5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V6M8.5 6V4.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V6" /><path d="M10 11v6M14 11v6" /></>,
  truck: <><path d="M14 17.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10.5a1 1 0 0 0 1 1h1.5M15.5 17.5h-6.5M18.5 17.5H21a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.22-.62L18.3 8.4a1 1 0 0 0-.78-.4H14" /><circle cx="7" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></>,
  shield: <><path d="M20 12.5c0 5-3.5 7.6-7.6 9a1.2 1.2 0 0 1-.8 0C7.5 20.1 4 17.5 4 12.5V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  refresh: <><path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9L20.5 8.5M20.5 3.5v5h-5" /><path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3.5 15.5M3.5 20.5v-5h5" /></>,
  headset: <><path d="M3.5 13v-1a8.5 8.5 0 0 1 17 0v1" /><path d="M3.5 13h2.5a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 6 19H5a1.5 1.5 0 0 1-1.5-1.5zM20.5 13H18a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 18 19h1a1.5 1.5 0 0 0 1.5-1.5z" /><path d="M20.5 17.5V18a3.5 3.5 0 0 1-3.5 3.5h-4" /></>,
  lock: <><rect x="4" y="10.5" width="16" height="11" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /><path d="M12 15v2.5" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6.5 15h3" /></>,
  filter: <path d="M21 4H3l7.2 8.5V19l3.6 1.8v-8.3z" />,
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m21.5 7.5-8.4 5.3a2 2 0 0 1-2.2 0L2.5 7.5" /></>,
  pin: <><path d="M19.5 10c0 5-5.3 10-7 11.4a.8.8 0 0 1-1 0C9.8 20 4.5 15 4.5 10a7.5 7.5 0 0 1 15 0" /><circle cx="12" cy="10" r="2.6" /></>,
  phone: <path d="M21.5 16.6v2.9a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 3.6 1.5h2.9a2 2 0 0 1 2 1.7c.12.9.34 1.8.66 2.7a2 2 0 0 1-.45 2.1L7.5 9.2a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.45c.9.32 1.8.54 2.7.66a2 2 0 0 1 1.7 2z" />,
  sparkle: <path d="M10 3.5 11.6 8a3 3 0 0 0 1.9 1.9L18 11.5l-4.5 1.6a3 3 0 0 0-1.9 1.9L10 19.5l-1.6-4.5a3 3 0 0 0-1.9-1.9L2 11.5l4.5-1.6A3 3 0 0 0 8.4 8zM18 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="currentColor" stroke="none" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  quote: <path d="M21 14.5a2 2 0 0 1-2 2H8l-4.5 4V5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2z" />,
  calendar: <><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" strokeWidth="2.4" /></>,
  globe: <><circle cx="12" cy="12" r="9.5" /><path d="M12 2.5a14.5 14.5 0 0 0 0 19 14.5 14.5 0 0 0 0-19M2.5 12h19" /></>,
  star: <path d="M11.5 2.8a.55.55 0 0 1 1 0l2.3 4.7a2.1 2.1 0 0 0 1.6 1.15l5.15.75a.55.55 0 0 1 .3.94l-3.73 3.63a2.1 2.1 0 0 0-.6 1.88l.88 5.13a.55.55 0 0 1-.8.58l-4.6-2.43a2.1 2.1 0 0 0-2 0l-4.6 2.43a.55.55 0 0 1-.8-.58l.88-5.13a2.1 2.1 0 0 0-.6-1.88L2.35 10.34a.55.55 0 0 1 .3-.94l5.15-.75a2.1 2.1 0 0 0 1.6-1.15z" />,
  flag: <><path d="M4.5 22V15" /><path d="M4.5 15s1-1 4-1 5 2 8 2 4-1 4-1V3.5s-1 1-4 1-5-2-8-2-4 1-4 1z" /></>,
  tv: <><rect x="2.5" y="7" width="19" height="14" rx="2.5" /><path d="m17 2.5-5 4.5-5-4.5" /></>,
};
/* in the two-tone style these shapes get the tinted fill (open strokes such as arrows never do) */
const TONE = new Set(["user", "cart", "trash", "truck", "shield", "headset", "lock", "card", "mail", "pin", "phone", "clock", "quote", "calendar", "globe", "star", "flag", "tv", "search"]);
export const Icon = ({ name, size = 22, tone = false }) => {
  const fill = tone && TONE.has(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} fillOpacity={fill ? 0.16 : undefined} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={tone ? "ico-tone" : undefined}>
      {ICONS[name]}
    </svg>
  );
};


/* Spec-plate drawings (design direction B): technical line drawings on a 96x72 plate, ink outline, blue dimension
   marks with small monospace labels, one brand-red point. Keyed by the same names as Icon so feature spots can swap. */
const D = ({ d }) => <path className="sp-dim" pathLength="100" d={d} />;
const T = ({ x, y, children }) => <text className="sp-dimt" x={x} y={y}>{children}</text>;
const SPEC = {
  refresh: <><path className="sp-st" pathLength="100" d="M30 40a16 16 0 1 0 5-11M28 21v9h9" /><circle className="sp-acc" cx="46" cy="40" r="2.6" /><D d="M68 24v32M64 24h8M64 56h8" /><T x="74" y="43">30d</T></>,
  shield: <><path className="sp-st" pathLength="100" d="M40 8 24 14v12c0 11 7 18 16 22 9-4 16-11 16-22V14zM33 28l5 5 9-10" /><D d="M64 14h18M64 30h12M64 44h6" /><T x="84" y="16">3y</T><T x="78" y="32">2y</T><T x="72" y="46">1y</T><circle className="sp-acc" cx="40" cy="8" r="2.4" /></>,
  headset: <><path className="sp-st" pathLength="100" d="M22 40v-4a18 18 0 0 1 36 0v4M22 40h5v11h-5zM53 40h5v11h-5zM58 51c0 5-4 8-9 8h-6" /><circle className="sp-acc" cx="42" cy="59" r="2.6" /><D d="M68 18v34M64 18h8M64 52h8" /><T x="73" y="38">US</T></>,
  user: <><circle className="sp-st" pathLength="100" cx="28" cy="24" r="8" /><path className="sp-st" pathLength="100" d="M14 56c0-9 6-14 14-14s14 5 14 14" /><circle className="sp-st" pathLength="100" cx="60" cy="24" r="8" /><path className="sp-st" pathLength="100" d="M46 56c0-9 6-14 14-14s14 5 14 14" /><circle className="sp-acc" cx="44" cy="24" r="2.6" /><D d="M14 64h60M14 61v6M74 61v6" /><T x="80" y="66">1:1</T></>,
  search: <><rect className="sp-st" pathLength="100" x="44" y="16" width="38" height="26" rx="2" /><path className="sp-st" pathLength="100" d="M44 23h38" /><circle className="sp-st" pathLength="100" cx="34" cy="38" r="15" /><path className="sp-st" pathLength="100" d="M45 49l11 11" /><path className="sp-dim" pathLength="100" d="M29 38h10M34 33v10" /><circle className="sp-acc" cx="34" cy="38" r="2.4" /><D d="M44 50h38M44 47v6M82 47v6" /><T x="60" y="58">6Q</T></>,
  calendar: <><rect className="sp-st" pathLength="100" x="16" y="14" width="40" height="42" rx="3" /><path className="sp-st" pathLength="100" d="M16 26h40M26 9v9M46 9v9" /><path className="sp-st" pathLength="100" d="M24 34h.01M32 34h.01M40 34h.01M48 34h.01M24 42h.01M32 42h.01M48 42h.01M24 50h.01M32 50h.01" strokeWidth="2.6" /><circle className="sp-acc" cx="40" cy="42" r="2.8" /><D d="M66 14v42M62 14h8M62 56h8" /><T x="71" y="38">30m</T></>,
  card: <><rect className="sp-st" pathLength="100" x="12" y="18" width="50" height="32" rx="3" /><path className="sp-st" pathLength="100" d="M12 27h50M18 42h12" /><circle className="sp-acc" cx="52" cy="41" r="2.8" /><D d="M70 50v-6M76 50v-12M82 50v-18M88 50v-24M68 54h22" /><T x="70" y="64">/mo</T></>,
  star: <><path className="sp-st" pathLength="100" d="M36 10l7 14 15 2-11 11 3 15-14-7-14 7 3-15-11-11 15-2z" /><circle className="sp-acc" cx="36" cy="32" r="2.4" /><D d="M66 14h22M66 26h20M66 38h22M66 50h14" /><T x="66" y="64">4.92</T></>,
  flag: <><path className="sp-st" pathLength="100" d="M20 62V12M20 14h30l-6 9 6 9H20" /><circle className="sp-acc" cx="20" cy="12" r="2.6" /><path className="sp-st" pathLength="100" d="M56 62V40h20v22M62 48h8M62 55h8" /><D d="M14 66h68" /><T x="64" y="34">CA</T></>,
  tv: <><rect className="sp-st" pathLength="100" x="16" y="20" width="46" height="32" rx="3" /><path className="sp-st" pathLength="100" d="M30 8l9 12 9-12M30 60h18" /><path className="sp-st" pathLength="100" d="M35 30l10 6-10 6z" /><circle className="sp-acc" cx="56" cy="26" r="2.4" /><D d="M70 20v32M66 20h8M66 52h8" /><T x="75" y="39">TV</T></>,
};
export const SpecIcon = ({ name, className = "" }) => (
  <svg className={`spec-ico ${className}`} viewBox="0 0 96 72" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {SPEC[name] || SPEC.search}
  </svg>
);

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

/** Countdown with flip digits: each digit is keyed by its value, so only the digits that change replay the flip. */
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
        <span key={label} className={`cd-${label.toLowerCase()}`}><strong aria-label={String(n)}>{String(n).padStart(2, "0").split("").map((d, i) => <i key={`${i}-${d}`} aria-hidden="true">{d}</i>)}</strong><small>{t(label)}</small></span>
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
