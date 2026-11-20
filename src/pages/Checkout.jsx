import { useState } from "react";
import { t } from "../i18n.js";
import { asset, frontImg, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";

/* Checkout after the Insta360 Store checkout (store.insta360.com/order/confirm, checked again 2026-11-19):
   header with only the logo and "Secure"; "Check out as guest"; left column of step cards that open one after another
   (Contact info + Shipping details with Save → Shipping method → Billing address → Payment method), each saved step folding
   into a one-line summary with Edit; right sticky "Order summary" with Edit cart, items, coupon code, totals and Place order.
   On phones the summary folds into a bar at the top. Checks out the lines ticked in the cart.
   Design draft: nothing typed here is stored or sent, and payment fields are disabled. */

const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "Washington DC", "West Virginia", "Wisconsin", "Wyoming"];
const REQUIRED = ["email", "first", "last", "phone", "street", "city", "state", "zip"];

const Field = ({ label, name, value, onChange, bad, required = true, className = "", ...rest }) => (
  <label className={`ik-field ${bad ? "bad " : ""}${className}`}>
    <input placeholder=" " name={name} value={value || ""} onChange={(e) => onChange(name, e.target.value)} {...rest} />
    <span>{label}{required && <i> *</i>}</span>
  </label>
);
const picture = (i) => (i.product.kind === "machine" ? frontImg(i.product) : i.variant.image || i.product.images[0]);

export default function Checkout() {
  const { picked: items, subtotal, savings, clearPicked } = useCart();
  const [done, setDone] = useState(null);
  const [step, setStep] = useState(0); // 0 contact + address, 1 shipping method, 2 billing + payment
  const [f, setF] = useState({ state: "" });
  const [err, setErr] = useState({});
  const [method, setMethod] = useState("card");
  const [sameBill, setSameBill] = useState(true);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [open, setOpen] = useState(false); // phone: order summary folded
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); if (err[k]) setErr((e) => ({ ...e, [k]: false })); };
  const machines = items.some((i) => i.product.kind === "machine");
  const count = items.reduce((s, i) => s + i.qty, 0);

  const head = (
    <header className="ik-header">
      <div><Link to="/" className="brand"><img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /><span>{t("Store")}</span></Link><span className="ik-secure"><Icon name="shield" size={18} />{t("Secure checkout")}</span></div>
    </header>
  );
  if (done)
    return (
      <div className="ik">{head}
        <div className="ik-done"><span><Icon name="check" size={34} /></span><h1>{t("Thank you — this is a demo order")}</h1><p>{t("Confirmation page layout. No order was placed and no payment was taken. Demo total:")} {money(done)}.</p><Link to="/" className="ik-pill">{t("Back to store")}</Link></div>
      </div>
    );
  if (!items.length)
    return <div className="ik">{head}<div className="ik-done"><h1>{t("Nothing to check out")}</h1><p>{t("Tick the items you want in your cart, or keep shopping.")}</p><div className="ik-done-btns"><Link to="/cart" className="ik-pill">{t("Back to cart")}</Link><Link to="/collections/machines" className="ik-pill ghost">{t("Shop laser machines")}</Link></div></div></div>;

  const saveAddress = () => {
    const bad = {};
    REQUIRED.forEach((k) => { if (!String(f[k] || "").trim()) bad[k] = true; });
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) bad.email = true;
    if (f.zip && !/^\d{5}(-\d{4})?$/.test(f.zip.trim())) bad.zip = true;
    setErr(bad);
    if (Object.keys(bad).length) { document.querySelector(".ik-field.bad, .ik-select.bad")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setStep(1);
  };
  const place = () => { setDone(subtotal); clearPicked(); window.scrollTo(0, 0); };
  const applyCode = () => setCodeMsg(code.trim() ? t("Codes are checked on the live store. This draft does not apply discounts.") : t("Enter a code first."));

  const summary = (
    <>
      <ul className="ik-lines">
        {items.map((i) => (
          <li key={i.variantId}>
            <span className="ik-thumb"><img src={img(picture(i), 160)} alt="" /><em>{i.qty}</em></span>
            <span><b>{i.product.name}</b>{i.variant.title && i.variant.title !== "Default Title" && <em>{i.variant.title}</em>}</span>
            <strong>{money(i.total)}{i.variant.compareAt > i.variant.price && <s>{money(i.variant.compareAt * i.qty)}</s>}</strong>
          </li>
        ))}
      </ul>
      <h3>{t("Coupon code")}</h3>
      <div className="ik-coupon">
        <input value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg(""); }} placeholder={t("Enter your coupon code")} aria-label={t("Coupon code")} onKeyDown={(e) => e.key === "Enter" && applyCode()} />
        <button type="button" onClick={applyCode} aria-label={t("Apply")} className={code.trim() ? "on" : ""}><Icon name="arrow" size={18} /></button>
      </div>
      {codeMsg && <p className="ik-code-msg" role="status">{codeMsg}</p>}
      <dl>
        <div><dt>{t("Subtotal")}</dt><dd>{money(subtotal + savings)}</dd></div>
        {savings > 0 && <div className="save"><dt>{t("Savings")}</dt><dd>−{money(savings)}</dd></div>}
        <div><dt>{t("Shipping")}</dt><dd>{step > 0 ? t(machines ? "Quoted after address review" : "Calculated after address") : t("Enter your address")}</dd></div>
        <div><dt>{t("Tax")}</dt><dd>{step > 0 ? t("Calculated after address") : t("Enter your address")}</dd></div>
        <div className="total"><dt>{t("Total")}</dt><dd><small>USD</small> {money(subtotal)}</dd></div>
      </dl>
    </>
  );

  return (
    <div className="ik">
      {head}
      <button type="button" className={`ik-fold${open ? " open" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span><Icon name="cart" size={18} />{t(open ? "Hide order summary" : "Show order summary")} ({count})<Icon name="chevron" size={14} /></span>
        <b>{money(subtotal)}</b>
      </button>
      {open && <div className="ik-fold-body">{summary}</div>}
      <div className="ik-wrap">
        <h1>{t("Check out as guest")}</h1>
        <ol className="ik-steps" aria-label={t("Checkout steps")}>
          {["Address", "Shipping", "Payment"].map((s, n) => <li key={s} className={n < step ? "done" : n === step ? "now" : ""}><i>{n < step ? <Icon name="check" size={12} /> : n + 1}</i>{t(s)}</li>)}
        </ol>
        <div className="ik-layout">
          <div className="ik-left">
            <section className="ik-card">
              <h2>{t("Contact info")}</h2>
              {step === 0 ? (
                <>
                  <Field label={t("Email Address")} name="email" type="email" autoComplete="email" value={f.email} onChange={set} bad={err.email} />
                  <p className="ik-hint">{t("We'll send the order confirmation and updates here.")} {t("Have an account?")} <Link href="https://www.1laser.com/account/login">{t("LOG IN")}</Link></p>
                  <h2 className="ik-divided">{t("Shipping details")}</h2>
                  <div className="ik-grid">
                    <label className="ik-field ik-static c2"><span>{t("Country/Region")}<i> *</i></span><b>{t("United States")}</b></label>
                    <Field label={t("First name")} name="first" autoComplete="given-name" value={f.first} onChange={set} bad={err.first} />
                    <Field label={t("Last name")} name="last" autoComplete="family-name" value={f.last} onChange={set} bad={err.last} />
                    <Field label={t("Mobile number")} name="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set} bad={err.phone} className="c2" />
                    <Field label={t("Street address")} name="street" autoComplete="address-line1" value={f.street} onChange={set} bad={err.street} className="c2" />
                    <Field label={t("Apt, Suite, Building (Optional)")} name="apt" autoComplete="address-line2" value={f.apt} onChange={set} required={false} className="c2" />
                    <p className="ik-note c2">{t("* The address should be in the country or region you have selected.")}<br />{t("* To facilitate delivery, please do not enter a P.O. Box, FPO, APO address, or remote area.")}</p>
                    <Field label={t("City")} name="city" autoComplete="address-level2" value={f.city} onChange={set} bad={err.city} />
                    <label className={`ik-field ik-select${err.state ? " bad" : ""}${f.state ? " has" : ""}`}>
                      <select value={f.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1"><option value="" disabled>{t("State")}</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
                      <span>{t("State")}<i> *</i></span><Icon name="chevron" size={14} />
                    </label>
                    <Field label={t("ZIP")} name="zip" inputMode="numeric" autoComplete="postal-code" value={f.zip} onChange={set} bad={err.zip} className="c2" />
                    {machines && <p className="ik-freight c2"><Icon name="truck" size={18} /><span>{t("Machines ship by freight. Tell us in the next step if the address needs a lift gate or has limited access.")}</span></p>}
                    {Object.keys(err).some((k) => err[k]) && <p className="ik-err c2" role="alert">{t("Please check the fields marked in red.")}</p>}
                    <div className="ik-actions c2"><button type="button" className="ik-pill" onClick={saveAddress}>{t("Save and continue")}</button></div>
                  </div>
                </>
              ) : (
                <div className="ik-saved">
                  <span><b>{f.first} {f.last}</b> · {f.email} · {f.phone}<br />{f.street}{f.apt ? `, ${f.apt}` : ""}, {f.city}, {f.state} {f.zip}</span>
                  <button type="button" onClick={() => setStep(0)}>{t("Edit")}</button>
                </div>
              )}
            </section>

            <section className={`ik-card${step < 1 ? " off" : ""}`}>
              <h2>{t("Shipping method")}</h2>
              {step === 1 && (
                <>
                  <label className="ik-choice on"><input type="radio" name="ship" defaultChecked /><span><b>{t(machines ? "Freight delivery" : "Standard shipping")}</b><em>{t(machines ? "Rate and delivery date confirmed after address review" : "Rate and delivery estimate shown after address review")}</em></span></label>
                  {machines && (
                    <label className="ik-field ik-area"><textarea rows={2} placeholder=" " value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} /><span>{t("Delivery notes (optional): lift gate, stairs, loading dock…")}</span></label>
                  )}
                  <div className="ik-actions"><button type="button" className="ik-pill" onClick={() => setStep(2)}>{t("Continue to payment")}</button></div>
                </>
              )}
              {step > 1 && <div className="ik-saved"><span>{t(machines ? "Freight delivery" : "Standard shipping")}{f.notes ? ` · ${f.notes}` : ""}</span><button type="button" onClick={() => setStep(1)}>{t("Edit")}</button></div>}
            </section>

            <section className={`ik-card${step < 2 ? " off" : ""}`}>
              <h2>{t("Billing address")}</h2>
              {step === 2 && (
                <>
                  <label className="ik-check"><input type="checkbox" checked={sameBill} onChange={(e) => setSameBill(e.target.checked)} /><span>{t("Same as shipping address")}</span></label>
                  {!sameBill && (
                    <div className="ik-grid ik-bill">
                      <Field label={t("Street address")} name="bStreet" value={f.bStreet} onChange={set} className="c2" />
                      <Field label={t("City")} name="bCity" value={f.bCity} onChange={set} />
                      <Field label={t("ZIP")} name="bZip" value={f.bZip} onChange={set} />
                    </div>
                  )}
                </>
              )}
            </section>

            <section className={`ik-card${step < 2 ? " off" : ""}`}>
              <h2>{t("Payment method")}</h2>
              {step === 2 && (
                <>
                  {[
                    ["card", "Credit / debit card", "Visa, Mastercard, Amex, Discover"],
                    ["paypal", "PayPal", "You'll finish on PayPal"],
                    ["shop", "Shop Pay Installments", "Pay over time: 3, 6 or 12 monthly payments, 0–36% APR, subject to eligibility"],
                  ].map(([id, label, sub]) => (
                    <label key={id} className={`ik-choice${method === id ? " on" : ""}`}>
                      <input type="radio" name="pay" checked={method === id} onChange={() => setMethod(id)} />
                      <span><b>{t(label)}</b><em>{t(sub)}</em></span>
                    </label>
                  ))}
                  {method === "card" && (
                    <div className="ik-grid ik-cardfields">
                      <Field label={t("Card number")} name="card" onChange={() => {}} className="c2" disabled /><Field label={t("Expiration (MM / YY)")} name="exp" onChange={() => {}} disabled /><Field label={t("Security code")} name="cvc" onChange={() => {}} disabled />
                    </div>
                  )}
                  <p className="ik-biz"><Icon name="card" size={18} /><span>{t("Buying for a business? $0-down loans and lease-to-own are arranged before you order.")} <Link to="/pages/financing">{t("See business financing")}</Link></span></p>
                  <p className="ik-hint">{t("Payment fields are disabled in this design draft.")}</p>
                </>
              )}
            </section>
          </div>

          <aside className="ik-card ik-summary">
            <div className="ik-summary-head"><h2>{t("Order summary")}</h2><Link to="/cart">{t("Edit cart")}</Link></div>
            <div className="ik-summary-body">{summary}</div>
            <button type="button" className="ik-pill wide" disabled={step < 2} onClick={place}>{step < 2 ? t("Complete the steps to place your order") : `${t("Place order")} · ${money(subtotal)}`}</button>
            <ul className="ik-trust">
              <li><Icon name="lock" size={16} />{t("Secure, encrypted checkout")}</li>
              <li><Icon name="refresh" size={16} />{t("30-day return period")}</li>
              <li><Icon name="headset" size={16} />{t("U.S.-based support from laser engineers")}</li>
            </ul>
            <p className="ik-legal">{t("Demo only — no charge, no order. By clicking \"Place order\" on the live store you would accept the OneLaser sales and privacy policies.")}</p>
          </aside>
        </div>
      </div>
      <div className="ik-bar">
        <p><small>{t("Total")}</small><b>{money(subtotal)}</b></p>
        <button type="button" className="ik-pill" disabled={step < 2} onClick={place}>{t("Place order")}</button>
      </div>
    </div>
  );
}
