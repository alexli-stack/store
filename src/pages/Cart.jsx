import { byHandle, frontImg, img, money } from "../lib.js";
import { t } from "../i18n.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";

/* Cart after the Insta360 Store cart (store.insta360.com/cart, checked again 2026-11-19 at 1440):
   gray page, "Shopping cart" title, left column of white cards (delivery note, then each item with a tick box,
   picture, name, return tag, options, stepper, price and bin; add-ons for the item listed under it with an "Add" link),
   right sticky "Order details" card (price, shipping, tax, estimated total, pay-over-time line, Check out button,
   delivery / returns / support / payment notes), then "You might also like". On phones the total and button stay at the bottom.
   Add-ons and suggestions are real OneLaser catalog products. */

const SERVICES = ["engineer-1-on-1-training-support", "lightburn-software-pro-license-key"];
const CHILLER = "onelaser-industrial-chiller-for-hydra-laser-engraver"; // "for Hydra & Cobra glass tube laser system"
const GLASS = ["cobra", "hydra"]; // series that can run a glass tube; Hydra 7 Gen2 is RF only
const SUGGEST = ["piburn-v-for-onelaser", "air-assist-for-laser-engraver-cutter", "filtrabox-micro", "lightburn-software-pro-license-key", "multi-function-rotary-axis-57-motor", "engineer-1-on-1-training-support", "1-8-frosted-matte-acrylic-sheets-12-12-4-pack-for-laser-engraving-cutting"];
const PAY = ["Visa", "Mastercard", "Amex", "PayPal", "Shop Pay", "Affirm"];

const addOnsFor = (p) => {
  if (p.kind !== "machine") return [];
  const list = [...SERVICES];
  if (GLASS.includes(p.series) && !/hydra-7/.test(p.handle)) list.unshift(CHILLER);
  return list.map((h) => byHandle[h]).filter(Boolean);
};
const picture = (p, v) => (p.kind === "machine" ? frontImg(p) : v?.image || p.images[0]);

function Suggestions({ exclude = [] }) {
  const { add } = useCart();
  const list = SUGGEST.filter((h) => !exclude.includes(h)).map((h) => byHandle[h]).filter(Boolean).slice(0, 4);
  return (
    <section className="ic-more">
      <h2>{t("You might also like")}</h2>
      <ul>
        {list.map((p) => (
          <li key={p.handle}>
            <Link to={`/products/${p.handle}`} className="ic-more-img"><img src={img(p.images[0], 400)} alt="" loading="lazy" /></Link>
            <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
            <p><b>{money(p.price)}</b>{p.compareAt > p.price && <s>{money(p.compareAt)}</s>}</p>
            <button type="button" className="ic-more-add" onClick={() => add(p.handle, p.variants[0].id)}><Icon name="cart" size={16} />{t("Add to cart")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Cart() {
  const { items, picked, setQty, add, subtotal, savings, toggle, toggleAll } = useCart();
  const inCart = items.map((i) => i.product.handle);
  if (!items.length)
    return (
      <section className="ic">
        <div className="ic-wrap">
          <h1>{t("Shopping cart")}</h1>
          <div className="ic-card ic-empty">
            <span className="ic-empty-ico"><Icon name="cart" size={40} /></span>
            <b>{t("Your shopping cart is empty")}</b>
            <p>{t("Not sure where to start? Answer a few questions and we'll match you with a machine.")}</p>
            <div className="ic-empty-btns">
              <Link to="/collections/machines" className="ic-checkout">{t("Shop laser machines")}</Link>
              <Link to="/" className="ic-ghost">{t("Find my machine")}</Link>
            </div>
          </div>
          <Suggestions />
        </div>
      </section>
    );
  const all = picked.length === items.length;
  const pickedQty = picked.reduce((s, i) => s + i.qty, 0);
  const machine = picked.find((i) => i.product.kind === "machine") || items.find((i) => i.product.kind === "machine");
  return (
    <section className="ic">
      <div className="ic-wrap">
        <h1>{t("Shopping cart")}</h1>
        <div className="ic-layout">
          <div className="ic-left">
            <div className="ic-card ic-note">
              <Icon name="truck" size={22} />
              <p><b>{t("Ships from the U.S.")}</b> {t("Delivery estimate and shipping rate are shown at checkout once you enter your address.")}</p>
            </div>
            <div className="ic-card ic-lines">
              <label className="ic-all">
                <input type="checkbox" checked={all} onChange={(e) => toggleAll(e.target.checked)} />
                <span>{t("Select all")} ({items.length})</span>
              </label>
              {items.map((i) => {
                const addOns = addOnsFor(i.product).filter((a) => !inCart.includes(a.handle));
                return (
                  <article key={i.variantId} className={`ic-item${i.off ? " off" : ""}`}>
                    <div className="ic-line">
                      <input type="checkbox" className="ic-pick" checked={!i.off} onChange={() => toggle(i.variantId)} aria-label={`${t("Check out")} ${i.product.name}`} />
                      <Link to={`/products/${i.product.handle}`} className="ic-line-media"><img src={img(picture(i.product, i.variant), 300)} alt="" /></Link>
                      <div className="ic-line-info">
                        <h2><Link to={`/products/${i.product.handle}`}>{i.product.name}</Link></h2>
                        <span className="ic-tag">{t("30-Day Returns")}</span>
                        {i.variant.title && i.variant.title !== "Default Title" && <p>{i.variant.title}</p>}
                        {["xrf", "hydra"].includes(i.product.series) && <p className="ic-warranty"><Icon name="shield" size={14} />{t("3-2-1 warranty included")}</p>}
                      </div>
                      <div className="ic-qty">
                        <button type="button" aria-label={t("Decrease quantity")} disabled={i.qty <= 1} onClick={() => setQty(i.variantId, i.qty - 1)}>−</button>
                        <span aria-live="polite">{i.qty}</span>
                        <button type="button" aria-label={t("Increase quantity")} onClick={() => setQty(i.variantId, i.qty + 1)}>+</button>
                      </div>
                      <div className="ic-line-price">{money(i.total)}{i.variant.compareAt > i.variant.price && <s>{money(i.variant.compareAt * i.qty)}</s>}</div>
                      <button type="button" className="ic-remove" aria-label={`${t("Remove")} ${i.product.name}`} onClick={() => setQty(i.variantId, 0)}><Icon name="trash" size={18} /></button>
                    </div>
                    {addOns.length > 0 && (
                      <ul className="ic-addons" aria-label={t("Recommended with this machine")}>
                        {addOns.map((a) => (
                          <li key={a.handle}>
                            <img src={img(a.images[0], 120)} alt="" />
                            <span><b>{a.name}</b><Link to={`/products/${a.handle}`}>{t("Learn more")}</Link></span>
                            <em>{money(a.price)}{a.compareAt > a.price && <s>{money(a.compareAt)}</s>}</em>
                            <button type="button" onClick={() => add(a.handle, a.variants[0].id)}>{t("Add")}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
          <aside className="ic-card ic-details">
            <h2>{t("Order details")}</h2>
            <p><span>{t("Price")} ({pickedQty} {t(pickedQty === 1 ? "item" : "items")})</span><span>{money(subtotal + savings)}</span></p>
            {savings > 0 && <p className="save"><span>{t("Savings")}</span><span>−{money(savings)}</span></p>}
            <p><span>{t("Shipping")}</span><span className="muted">{t("Calculated at checkout")}</span></p>
            <p><span>{t("Tax")}</span><span className="muted">{t("Calculated at checkout")}</span></p>
            <p className="total"><span>{t("Estimated total")}</span><b>{money(subtotal)}</b></p>
            {subtotal >= 1000 && (
              <Link to={`/pages/financing${machine ? `?p=${machine.product.handle}` : ""}`} className="ic-finance">
                <Icon name="card" size={16} />{t("Pay over time with financing.")} <u>{t("Estimate my payment")}</u>
              </Link>
            )}
            {picked.length ? <Link to="/checkout" className="ic-checkout">{t("Check out")}</Link> : <span className="ic-checkout off" aria-disabled="true">{t("Select an item to check out")}</span>}
            <Link to="/collections/machines" className="ic-continue">{t("Continue shopping")}</Link>
            <h3>{t("Shipped by OneLaser")}</h3>
            <ul>
              <li><Icon name="truck" size={20} /><span><b>{t("Delivery by address")}</b>{t("All items ship according to the item with the latest shipping date.")}</span></li>
              <li><Icon name="refresh" size={20} /><span><b>{t("30-day return period")}</b>{t("Terms and conditions apply.")}</span></li>
              <li><Icon name="headset" size={20} /><span><b>{t("U.S.-based support")}</b>{t("Talk to real laser engineers.")} <Link to="/pages/sales-consultation">{t("Book a free call")}</Link></span></li>
              <li><Icon name="lock" size={20} /><span><b>{t("Pay your way")}</b><span className="ic-pay">{PAY.map((x) => <i key={x}>{x}</i>)}</span></span></li>
            </ul>
          </aside>
        </div>
        <Suggestions exclude={inCart} />
      </div>
      <div className="ic-bar">
        <label><input type="checkbox" checked={all} onChange={(e) => toggleAll(e.target.checked)} /><span>{t("All")}</span></label>
        <p><small>{t("Estimated total")}</small><b>{money(subtotal)}</b></p>
        {picked.length ? <Link to="/checkout" className="ic-checkout">{t("Check out")} ({pickedQty})</Link> : <span className="ic-checkout off">{t("Check out")}</span>}
      </div>
    </section>
  );
}
