import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n.js";
import { byHandle, go, img, machines, products } from "../lib.js";
import { useCart } from "../cart.jsx";
import { addOns, faq, promo } from "../data/site.js";
import { Icon, Link, QtyStepper, usd } from "../components/ui.jsx";
import stories from "../data/stories.json";
import Story, { Look } from "../components/Story.jsx";

/* The whole page follows the Insta360 Store product page (store.insta360.com/product/x5, measured 2026-11-17 at 1440 and 390):
   full-bleed gray stage on the left (sticky) | 464px column: 32px title, option summary line, promo card, info card with icon rows,
   bordered option cards (72px image, selected card expands), "Frequently bought together" add-ons, gray order summary, shipping notes
   → sticky 49px white menu (product name left; Overview, Compare, Specs, FAQ, Accessories right, 13px bold)
   → black overview (intro image, "Take a closer look", stat row, feature sections — see components/Story.jsx)
   → "Compare models" (64px title, 250px columns, sticky name/price row, 22px values) → "Specs" (44px title, 28px groups, 240px labels)
   → white FAQ (32px title, numbered 16px rows) → white "You might also like" (288×534 cards, 128×40 pill)
   → fixed 80px bottom bar with name, 24px price and 56px pill buttons.
   Left out because OneLaser has no data or service for them: Reviews, Trade-In, coverage plans, cloud service, Insta360 Gold. */

function addOnsFor(product) {
  if (product.kind !== "machine") return [];
  return (addOns[product.family] || []).map((h) => byHandle[h]).filter((a) => a?.available);
}

/** Flatten the scraped story into DJI-style sections. */
function useStory(handle) {
  return useMemo(() => {
    const story = stories[handle];
    if (!story) return { highlights: [], cases: [], videos: [], specs: null, qa: [], bullets: null, blocks: [] };
    const cards = [];
    let cases = [];
    for (const b of story.blocks) {
      if (b.kind === "tabs" && /material/i.test(`${b.eyebrow} ${b.title}`)) cases = b.items.filter((i) => i.img);
      else if (b.kind === "tabs" || b.kind === "features") cards.push(b.items.filter((i) => i.img));
      else if (b.kind === "split" && b.image && b.intro) cards.push([{ title: b.title, text: b.intro, img: b.image }]);
    }
    // Round-robin across sections so the grid shows one headline feature per topic first.
    const highlights = [];
    for (let i = 0; highlights.length < 8 && cards.some((c) => c[i]); i++) cards.forEach((c) => c[i] && highlights.length < 8 && highlights.push(c[i]));
    if (!cases.length) cases = (story.blocks.find((b) => b.kind === "gallery")?.items || []).slice(0, 5).map((i) => ({ ...i, eyebrow: i.title, text: "" }));
    return {
      highlights, cases,
      videos: story.blocks.filter((b) => b.kind === "videos").flatMap((b) => b.videos).slice(0, 8),
      specs: story.blocks.find((b) => b.kind === "specs")?.groups || null,
      qa: story.blocks.find((b) => b.kind === "faq")?.qa || [],
      blocks: story.blocks.filter((b) => b.kind !== "specs" && b.kind !== "faq"),
      bullets: story.highlights.length >= 3 ? story.highlights.slice(0, 6) : null,
    };
  }, [handle]);
}

const COMPARE_ROWS = ["Laser source", "Work area", "Max engraving speed", "Acceleration", "Positioning accuracy", "Max resolution"];
function compareSet(product) {
  const current = machines.filter((m) => m.series !== "legacy");
  const same = current.filter((m) => m.series === product.series && m.handle !== product.handle);
  const others = current.filter((m) => m.series !== product.series);
  const flagship = ["onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"].map((h) => byHandle[h]).filter((m) => others.includes(m));
  return [product, ...[...same, ...flagship, ...others].filter((m, i, a) => a.indexOf(m) === i).slice(0, 3)];
}

export default function Product({ handle }) {
  const product = byHandle[handle];
  const { add } = useCart();
  const [variantId, setVariantId] = useState(null);
  const [photo, setPhoto] = useState(0);
  const [picked, setPicked] = useState({});
  const qty = 1;
  const [details, setDetails] = useState(null);
  const [active, setActive] = useState("overview");
  const [added, setAdded] = useState(null);
  useEffect(() => {
    setVariantId(null); setPhoto(0); setPicked({}); setDetails(null); setActive("overview");
  }, [handle]);
  useEffect(() => {
    const spy = () => {
      const ids = ["overview", "compare", "specs", "faq", "accessories"];
      let current = "overview";
      for (const id of ids) {
        const el = document.getElementById(`pdp-${id}`);
        if (el && el.getBoundingClientRect().top < 200) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", spy, { passive: true });
    return () => window.removeEventListener("scroll", spy);
  }, [handle]);
  const options = useMemo(() => addOnsFor(product || {}), [product]);
  const story = useStory(handle);
  if (!product) return <div className="container section-pad"><h1>{t("Product not found")}</h1><Link to="/">{t("Back to store")}</Link></div>;

  const variant = product.variants.find((v) => v.id === variantId) || product.variants.find((v) => v.available) || product.variants[0];
  const gallery = variant.image && !product.images.includes(variant.image) ? [variant.image, ...product.images] : product.images;
  const pickVariant = (v) => {
    setVariantId(v.id);
    const at = gallery.indexOf(v.image);
    setPhoto(at >= 0 ? at : 0);
  };
  const addOnTotal = options.reduce((s, a) => s + (picked[a.handle] || 0) * a.price, 0);
  const total = variant.price * qty + addOnTotal;
  const saved = variant.compareAt ? (variant.compareAt - variant.price) * qty : 0;
  const commit = (thenCheckout) => {
    add(product.handle, variant.id, qty);
    options.forEach((a) => picked[a.handle] && add(a.handle, a.variants[0].id, picked[a.handle]));
    go(thenCheckout ? "/checkout" : "/cart");
  };
  const isMachine = product.kind === "machine";
  const many = product.variants.length > 6;
  const models = isMachine && product.series !== "legacy" ? machines.filter((m) => m.series === product.series).sort((x, y) => x.price - y.price) : [];
  const compare = isMachine ? compareSet(product) : [];
  const questions = [...story.qa, ...faq];
  const specGroups = story.specs || (product.specs ? [{ group: "Key specifications", rows: [["Best for", product.bestFor], ...Object.entries(product.specs)] }] : null);
  const bullets = story.bullets || (product.specs ? Object.entries(product.specs).slice(0, 6).map(([k, v]) => `${k}: ${v}`) : [product.tagline]);
  const closer = story.highlights.slice(0, story.highlights.length >= 8 ? 8 : 4).map(({ title, text, img: src, video }) => ({ title, text, img: src, video }));
  const stats = isMachine && product.specs ? ["Max engraving speed", "Positioning accuracy", "Max resolution"].filter((k) => product.specs[k]).map((k) => [k, product.specs[k]]) : [];
  const likes = (isMachine ? [...options, ...products.filter((p) => p.kind === "accessory" && p.available && !options.includes(p))] : products.filter((p) => p.kind === product.kind && p.handle !== product.handle && p.available)).slice(0, 4);
  const sections = [["overview", "Overview"], compare.length > 1 && ["compare", "Compare"], specGroups && ["specs", "Specs"], ["faq", "FAQ"], likes.length && ["accessories", "Accessories"]].filter(Boolean);
  const jump = (id) => {
    setActive(id);
    document.getElementById(`pdp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const buttons = (
    <>
      <button type="button" className="buy" disabled={!variant.available} onClick={() => commit(false)}>{variant.available ? t("Add to Cart") : t("Sold Out")}</button>
      <button type="button" className="buy-now" disabled={!variant.available} onClick={() => commit(true)}>{t("Buy Now")}</button>
    </>
  );

  return (
    <div className="pdp">
      <section className="ip">
        <div className="ip-stage">
          <div className="ip-stage-view">
            <img src={img(gallery[photo] || gallery[0], 1400)} alt={product.name} />
            {gallery.length > 1 && (
              <>
                <button type="button" className="ip-arrow prev" aria-label={t("Previous image")} onClick={() => setPhoto((photo + gallery.length - 1) % gallery.length)}><Icon name="chevron" size={18} /></button>
                <button type="button" className="ip-arrow next" aria-label={t("Next image")} onClick={() => setPhoto((photo + 1) % gallery.length)}><Icon name="chevron" size={18} /></button>
              </>
            )}
          </div>
          <div className="ip-thumbs">
            {gallery.slice(0, 9).map((src, i) => <button key={src} type="button" className={i === photo ? "on" : ""} onClick={() => setPhoto(i)} aria-label={`Image ${i + 1}`}><img src={img(src, 160)} alt="" loading="lazy" /></button>)}
          </div>
        </div>

        <div className="ip-col">
          <h1>{product.name}</h1>
          <p className="ip-sub">{[variant.title, isMachine ? product.seriesName : null, product.tagline].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</p>

          {saved > 0 && (
            <Link to="/collections/deals" className="ip-promo">
              <span><img src={img(product.images[0], 240)} alt="" /></span>
              <span><b>{t("Black Friday: save")} {usd(variant.compareAt - variant.price).replace(".00", "")}</b><em>{t("Ends Cyber Monday, Nov 30. Price already applied.")}</em></span>
              <strong>{t("See all deals")}</strong>
            </Link>
          )}

          <div className="ip-info">
            <div><Icon name="truck" size={20} /><ul><li>{t("Delivery estimate and rate shown at checkout")}</li><li>{t("30-day easy returns")}{isMachine && ` | ${t("3-2-1 warranty")}`}</li><li>{t("U.S.-based support from laser engineers")}</li></ul></div>
            <div><Icon name="check" size={20} /><ul>{bullets.slice(0, 4).map((b) => <li key={b}>{b}</li>)}{product.fit && <li>{t("Fits:")} {product.fit}</li>}</ul></div>
            <div><Icon name="card" size={20} /><ul><li>{t("Financing available at checkout")} — <a href={`#/pages/financing?p=${product.handle}`}>{t("learn more")}</a></li></ul></div>
          </div>

          {models.length > 1 && (
            <>
              <div className="ip-label"><span>{t("Model")}</span></div>
              <div className="ip-models" role="radiogroup" aria-label={t("Model")}>
                {models.map((m) => (
                  <Link key={m.handle} to={`/products/${m.handle}`} data-keep-scroll role="radio" aria-checked={m.handle === product.handle} className={m.handle === product.handle ? "on" : ""}>
                    <b>{m.name.replace(/™/g, "")}</b><span>{usd(m.price)}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="ip-label"><span>{t("Select option")}</span>{isMachine && <Link to="/compare">{t("Compare machines")}</Link>}</div>
          {many ? (
            <select className="variant-select" value={variant.id} onChange={(e) => pickVariant(product.variants.find((v) => v.id === e.target.value))}>
              {product.variants.map((v) => <option key={v.id} value={v.id} disabled={!v.available}>{v.title} — {usd(v.price)}{v.available ? "" : " (sold out)"}</option>)}
            </select>
          ) : (
            <div className="ip-options">
              {product.variants.map((v) => (
                <button key={v.id} type="button" className={`ip-option${v.id === variant.id ? " on" : ""}`} disabled={!v.available} onClick={() => pickVariant(v)}>
                  {v.compareAt && <em>{t("Save")} {usd(v.compareAt - v.price).replace(".00", "")}</em>}
                  <span className="ip-option-head">
                    <img src={img(v.image || product.images[0], 200)} alt="" />
                    <span><b>{v.title || product.name}{!v.available && " (Sold out)"}</b><i>{usd(v.price)}{v.compareAt && <s>{usd(v.compareAt)}</s>}</i></span>
                  </span>
                  {v.id === variant.id && <span className="ip-option-body"><span>{product.tagline}</span>{product.bestFor && <span>{t("Best for")}: {product.bestFor}</span>}</span>}
                </button>
              ))}
            </div>
          )}

          {options.length > 0 && (
            <>
              <div className="ip-label"><span>{t("Frequently bought together")}</span></div>
              <div className="ip-addons">
                {options.map((a) => (
                  <article key={a.handle} className={picked[a.handle] ? "on" : ""}>
                    <label><input type="checkbox" checked={!!picked[a.handle]} onChange={(e) => setPicked((s) => ({ ...s, [a.handle]: e.target.checked ? 1 : 0 }))} aria-label={`Add ${a.name}`} /></label>
                    <img src={img(a.images[0], 200)} alt="" loading="lazy" />
                    <div><h3>{a.name}</h3><p>{usd(a.price)}</p></div>
                    <QtyStepper value={picked[a.handle] || 0} onChange={(n) => setPicked((s) => ({ ...s, [a.handle]: n }))} />
                    <p className="ip-addon-text">{a.tagline} <Link to={`/products/${a.handle}`}>{t("Learn more")}</Link></p>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="ip-summary">
            <h2>{product.name}</h2>
            <p>{variant.title || product.tagline}</p>
            {options.filter((a) => picked[a.handle]).map((a) => <p key={a.handle} className="ip-summary-line"><span>{a.name} × {picked[a.handle]}</span><span>{usd(a.price * picked[a.handle])}</span></p>)}
            <p className="ip-summary-total"><span>{t("Total")}</span><b>{usd(total)}</b></p>
            {saved > 0 && <p className="ip-summary-save">{t("You save")} {usd(saved)}</p>}
            <div className="buy-group">{buttons}</div>
          </div>

          <div className="ip-ship">
            <h2>{t("Shipped by OneLaser")}</h2>
            <p><Icon name="truck" size={20} /><span><b>{t("Delivery by address")}</b>{t("Estimate and shipping rate are shown at checkout. See the")} <a href="https://www.1laser.com/pages/shipping-policy" target="_blank" rel="noreferrer">{t("Shipping Policy")}</a>.</span></p>
            <p><Icon name="refresh" size={20} /><span><b>30-day return period</b>{t("See the")} <a href="https://www.1laser.com/pages/refund-policy" target="_blank" rel="noreferrer">{t("Refund Policy")}</a> for conditions.</span></p>
            <p><Icon name="lock" size={20} /><span><b>{t("Pay your way")}</b>{t("Card, PayPal, Shop Pay or financing.")}</span></p>
          </div>
        </div>
      </section>

      <menu className="im-menu">
        <div>
          <b>{product.name}</b>
          <ul>{sections.map(([id, label]) => <li key={id}><button type="button" className={active === id ? "on" : ""} onClick={() => jump(id)}>{t(label)}</button></li>)}</ul>
        </div>
      </menu>

      <div className="is" id="pdp-overview">
        {story.blocks.length > 0 ? (
          <>
            <Story key={`${handle}-a`} blocks={story.blocks.slice(0, 1)} />
            {closer.length >= 4 && <Look title={t("Take a closer look")} items={closer} />}
            {stats.length === 3 && (
              <section className="is-stats">
                <h2>{product.name} {t("at a glance")}</h2>
                <ul>{stats.map(([k, v]) => <li key={k}><b>{v}</b><span>{t(k)}</span></li>)}</ul>
              </section>
            )}
            <Story key={`${handle}-b`} blocks={story.blocks.slice(1)} />
          </>
        ) : (
          <section className="is-feature">
            <header className="is-head wide">
              <h4>{isMachine ? product.seriesName : "OneLaser Store"}</h4>
              <h2>{product.name}</h2>
              <p>{product.description}{product.description.length >= 1500 ? "…" : ""}</p>
            </header>
            <div className="is-media contain"><img src={img(product.images[1] || product.images[0], 1600)} alt="" loading="lazy" /></div>
          </section>
        )}

        {compare.length > 1 && (
          <section id="pdp-compare" className="is-compare">
            <h2>{t("Compare models")}</h2>
            <div className="is-compare-scroll">
              <div className={`is-compare-grid n${compare.length}`}>
                {compare.map((m) => <Link key={m.handle} to={`/products/${m.handle}`} className="is-compare-img"><img src={img(m.images[0], 500)} alt="" loading="lazy" /></Link>)}
                {compare.map((m, n) => (
                  <div key={m.handle} className="is-compare-head">
                    <b>{m.name}</b>
                    <strong>{usd(m.price).replace(".00", "")}</strong>
                    {n === 0 ? <span>{t("Now Viewing")}</span> : <Link to={`/products/${m.handle}`}>{t("Learn more")}</Link>}
                  </div>
                ))}
                {COMPARE_ROWS.map((r) => compare.map((m) => <div key={r + m.handle} className="is-compare-cell"><b>{m.specs[r]}</b><span>{t(r)}</span></div>))}
              </div>
            </div>
          </section>
        )}

        {specGroups && (
          <section id="pdp-specs" className="is-specs">
            <h3>{t("Specs")}</h3>
            {specGroups.map((g) => (
              <div key={g.group}>
                <h4>{g.group}</h4>
                <dl>{g.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              </div>
            ))}
          </section>
        )}
      </div>

      <section id="pdp-faq" className="iw">
        <h2>{t("FAQ")}</h2>
        <ul className="iw-faq">{questions.map(([q, a], n) => <li key={n}><details><summary><span>{n + 1} . {t(q)}</span><Icon name="chevron" size={16} /></summary><p>{t(a)}</p></details></li>)}</ul>
      </section>

      {likes.length > 0 && (
        <section id="pdp-accessories" className="iw like">
          <h2>{t("You might also like")}</h2>
          <div className="iw-like">
            {likes.map((a) => (
              <article key={a.handle}>
                <Link to={`/products/${a.handle}`}><img src={img(a.images[0], 600)} alt="" loading="lazy" /><b>{a.name}</b></Link>
                <p>{a.variants.length > 1 ? `${t("From")} ` : ""}{usd(a.price)}</p>
                {!a.available ? <button type="button" disabled>{t("Out of stock")}</button>
                  : a.variants.length > 1 ? <Link to={`/products/${a.handle}`} className="btn">{t("Select options")}</Link>
                  : <button type="button" onClick={() => { add(a.handle, a.variants[0].id, 1); setAdded(a.handle); }}>{added === a.handle ? t("Added") : t("Add to cart")}</button>}
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="ip-bar">
        <div className="ip-bar-name"><strong>{product.name}</strong><span>{variant.title || product.tagline}</span></div>
        <div className="ip-bar-price"><b>{usd(total)}</b>{saved > 0 && <small>{t("Save")} {usd(saved)}</small>}</div>
        <div className="ip-bar-btns">{buttons}</div>
      </div>
    </div>
  );
}
