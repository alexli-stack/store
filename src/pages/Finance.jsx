import { useEffect, useMemo, useState } from "react";
import { t } from "../i18n.js";
import { byHandle, frontImg, img, money } from "../lib.js";
import { Icon, Link } from "../components/ui.jsx";

/* Financing, redesigned from 1laser.com/pages/financing (read 2026-11-19).
   Every term, rate, requirement, step and answer below is the live page's; the apply links are the live page's links.
   New here: a payment estimator (plain amortisation, clearly marked as an estimate, not an offer)
   and a three-question picker that points to the option that fits. */

const CDN = "https://www.1laser.com/cdn/shop/files/";
const OPTIONS = [
  {
    id: "subsidy", name: "OneLaser Subsidy Loan", for: "Small businesses", logo: `${CDN}8f9dc9b3c44f0a725719dc9a3ea24977_0c2608bd-ca8d-4085-9a5e-10bd33b5083c.svg`,
    pitch: "$0 down, deferred payments and an interest rate subsidy, so you can grow while keeping your cash reserves.",
    facts: [["$0", "down payment"], ["3 mo", "payment-free start"], ["60 mo", "longest term"], ["Up to 7%", "interest subsidy"]],
    apply: "https://www.1laser.com/pages/onelaser-loan-form", applyLabel: "Apply for the OneLaser loan",
  },
  {
    id: "fcb", name: "First Citizens Bank", for: "Established businesses", logo: `${CDN}FCB_HOR_4C_reg_RGB.png`,
    pitch: "Equipment finance with competitive rates, custom terms and one point of contact from application to funding.",
    facts: [["600+", "FICO score"], ["2 yrs+", "in business"], ["$5,000", "minimum amount"], ["Sec. 179", "possible tax benefit"]],
    apply: "https://kraftengineeringcorp.firstcitizensef.com/", applyLabel: "Apply with First Citizens Bank",
  },
  {
    id: "shoppay", name: "Shop Pay Installments", for: "Anyone, at checkout", logo: `${CDN}Group16.png`,
    pitch: "Split your purchase into monthly payments right at checkout. Provided by Affirm and subject to an eligibility check.",
    facts: [["0–36%", "APR"], ["3 / 6 / 12", "monthly payments"], ["Checkout", "no separate application"], ["Small or large", "purchases"]],
    apply: null, applyLabel: "Choose it at checkout",
  },
  {
    id: "clicklease", name: "ClickLease", for: "Businesses, any credit", logo: `${CDN}Group17.png`,
    pitch: "Lease to own with $0 down and a small signing fee. Approval in minutes, even with imperfect credit.",
    facts: [["$0", "down + small signing fee"], ["Minutes", "to approval"], ["12–28%+", "typical APR"], ["Yours", "at the end of the term"]],
    apply: "https://www.clicklease.com/partner/onelaser", applyLabel: "Apply with ClickLease",
  },
];

/** Which options fit the answers: [fit, reason] per option id. */
function fitFor({ buyer, credit, years }, amount) {
  const out = {};
  const biz = buyer === "business";
  out.subsidy = !biz ? [false, "For businesses"] : amount < 5000 ? [false, "Needs a $5,000+ purchase"] : [true, amount >= 10000 ? "Full 7% subsidy at $10,000+" : "Subsidy from $5,000"];
  out.fcb = !biz ? [false, "For businesses"] : credit === "building" ? [false, "Needs a 600+ FICO score"] : years === "new" ? [false, "Needs 2+ years in business"] : amount < 5000 ? [false, "Needs $5,000 or more"] : [true, "Competitive bank rates"];
  out.shoppay = [true, biz ? "Quickest: pick it at checkout" : "The option for personal buyers"];
  out.clicklease = !biz ? [false, "For businesses"] : [true, credit === "building" ? "Approves imperfect credit" : "$0 down, approval in minutes"];
  return out;
}

const monthly = (amount, apr, n) => {
  const r = apr / 100 / 12;
  return r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));
};
const MACHINES = [
  "onelaser-xrf-desktop-laser-machine", "vertigo-vertical-laser-engraver", "cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter",
  "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine",
].map((h) => byHandle[h]).filter(Boolean);
const TERMS = [12, 24, 36, 48, 60];

const DETAILS = {
  subsidy: {
    lede: "If you're looking to upgrade your equipment without tying up your cash flow, the OneLaser Subsidy Loan for Small Business offers $0 down, deferred payments and exclusive interest rate subsidies.",
    points: [
      ["No upfront payment", "Get started immediately with zero down payment, allowing you to focus on growing your business."],
      ["Deferred payments", "The first three months of the loan are payment-free, easing your cash flow while your business ramps up."],
      ["Flexible terms", "Loan terms are available for up to 60 months, offering flexible payment options to fit your budget."],
      ["Early repayment", "You can repay your loan early. A small prepayment fee (typically 3%) may apply, depending on the lender's terms."],
    ],
  },
  fcb: {
    lede: "Financing through First Citizens Bank Equipment Finance and its network of third-party referral sources: a simple process with one point of contact throughout.",
    points: [
      ["Credit at a glance", "A minimum 600 FICO score for business principals or guarantors, at least 2 years in business, and generally a minimum finance amount of $5,000. No credit decision is made until your application is reviewed."],
      ["Choose your term", "A good rule of thumb: pick a payment of about 25% of the extra monthly revenue you expect, so the equipment can pay for itself."],
      ["Possible tax benefits", "With an equipment finance agreement or a $1-residual lease you may be able to use Section 179 to depreciate in one year. With a fair-market-value lease, payments can be deducted as an operating expense."],
      ["Competitive rates", "Competitive rates and customised terms to fit your specific needs."],
    ],
  },
  shoppay: {
    lede: "A simple way to finance your OneLaser purchase: choose Shop Pay Installments when you check out.",
    points: [
      ["How it works", "Pay in 3, 6 or 12 monthly installments on the purchase."],
      ["Example", "An $800 purchase could be split into 12 monthly payments of $72.21 at 15% APR, or 4 interest-free payments of $200 every 2 weeks."],
      ["Rates", "Rates from 0% to 36% APR. Options depend on your purchase amount, and a down payment may be required."],
      ["Eligibility", "Payment options through Shop Pay Installments are subject to an eligibility check and are provided by Affirm's lending partners."],
    ],
    links: [["Affirm lending disclosures", "https://www.affirm.com/disclosures"], ["Lending partners", "https://www.affirm.com/lenders"], ["State notices to consumers", "https://www.affirm.com/licenses"]],
  },
  clicklease: {
    lede: "For businesses that need larger equipment or prefer long-term financing, especially for larger purchases like the Hydra series or high-powered desktop models.",
    steps: [
      ["Apply with ClickLease", "Start your application with the ClickLease link on this page."],
      ["Get approved", "After approval, a OneLaser sales representative emails you the approval notice and the next steps."],
      ["Confirm your order", "Choose your products with our sales representative, who prepares a quote for ClickLease."],
      ["Sign documents", "ClickLease sends you the documents to sign and finalise the terms."],
      ["Review and approval", "ClickLease reviews and approves your signed documents."],
      ["Release of funds", "Once ClickLease pays OneLaser, your order is processed and prepared for shipment."],
    ],
  },
};

const FAQ = [
  ["OneLaser Subsidy Loan", [
    ["What happens if my credit doesn't meet the requirements?", "The interest rate may be higher. The final interest rate is set by the third-party lender based on your credit profile and other factors."],
    ["Is there a minimum purchase amount for the interest rate subsidy?", "Yes. The minimum equipment purchase is $5,000. For purchases above $10,000 you can receive the maximum 7% interest subsidy."],
    ["Can I apply if I'm a new business?", "Yes. The program is open to businesses of all sizes, including new businesses. Approval depends on your business's creditworthiness and other factors."],
    ["Can I pay off my loan early?", "Yes. A small prepayment fee (typically 3%) may apply, depending on the lender's terms."],
  ]],
  ["ClickLease", [
    ["What is ClickLease?", "A lease-to-own option offered by OneLaser. You can order machines and laser accessories and pay monthly."],
    ["How does the process work?", "You apply and get approved by ClickLease. OneLaser creates an invoice with the order total and items; ClickLease uses it to generate your contract. Once you sign, ClickLease pays OneLaser directly and we ship your order."],
    ["How do I qualify?", "Apply directly on the ClickLease website. Approval decisions are made solely by ClickLease; if you are declined, please contact ClickLease directly."],
    ["How much would my monthly payment be?", "ClickLease calculates it from an invoice from OneLaser that shows your order total."],
    ["How much do I pay upfront?", "Down payments are optional and paid to OneLaser. OneLaser then invoices ClickLease for the remaining balance, and your monthly payment is based on that balance."],
    ["Can I negotiate prices or change my order?", "No. Website prices are final and the lease is based on the order total. Once a contract is signed, the invoice cannot be updated."],
    ["My order shipped. How do I cancel it?", "A restocking fee is deducted from the refund issued to ClickLease. The refund is processed once all items are back in the warehouse."],
  ]],
];

function Estimator({ amount, setAmount, handle, setHandle }) {
  const [term, setTerm] = useState(36);
  const [apr, setApr] = useState(15);
  const pay = monthly(amount, apr, term);
  const total = pay * term;
  const p = byHandle[handle];
  return (
    <div className="fi-calc" id="estimate">
      <div className="fi-calc-head">
        <p className="fi-kicker">{t("Payment estimator")}</p>
        <div className="fi-calc-pick">
          {p && <img src={img(frontImg(p), 300)} alt="" />}
          <label>
            <span>{t("Machine")}</span>
            <select value={handle} onChange={(e) => { setHandle(e.target.value); if (byHandle[e.target.value]) setAmount(byHandle[e.target.value].price); }}>
              {MACHINES.map((m) => <option key={m.handle} value={m.handle}>{m.name} · {money(m.price)}</option>)}
              <option value="custom">{t("Other amount")}</option>
            </select>
          </label>
        </div>
      </div>
      <div className="fi-calc-body">
        <label className="fi-amount">
          <span>{t("Amount to finance")}</span>
          <span className="fi-amount-in"><em>$</em><input type="number" inputMode="numeric" min="500" step="100" value={Math.round(amount)} onChange={(e) => { setAmount(Math.max(0, Number(e.target.value) || 0)); setHandle("custom"); }} /></span>
        </label>
        <div className="fi-row">
          <span>{t("Term")}</span>
          <div className="fi-seg">{TERMS.map((n) => <button key={n} type="button" className={n === term ? "on" : ""} aria-pressed={n === term} onClick={() => setTerm(n)}>{n} {t("mo")}</button>)}</div>
        </div>
        <label className="fi-row">
          <span>{t("APR")} <b>{apr}%</b></span>
          <input type="range" min="0" max="36" step="1" value={apr} onChange={(e) => setApr(Number(e.target.value))} style={{ "--v": `${(apr / 36) * 100}%` }} />
          <small className="fi-scale"><span>0%</span><span>{t("Rates on this page range from 0% to 36%")}</span><span>36%</span></small>
        </label>
        <div className="fi-result" aria-live="polite">
          <div><small>{t("Estimated monthly payment")}</small><b>{money(Math.round(pay))}<em>/{t("mo")}</em></b></div>
          <div><small>{t("Total over")} {term} {t("months")}</small><span>{money(Math.round(total))}</span></div>
        </div>
        <p className="fi-fine">{t("Estimate only, not an offer of credit. Your actual rate, term and payment are set by the lender after you apply.")}</p>
      </div>
    </div>
  );
}

export default function Finance({ query }) {
  useEffect(() => { document.title = "Financing | OneLaser"; return () => { document.title = "OneLaser Store — Redesign Draft"; }; }, []);
  const start = byHandle[query?.get("p")] ? query.get("p") : "hydra-9-gen-2-70w-rf-co2-dual-laser-machine";
  const [handle, setHandle] = useState(start);
  const [amount, setAmount] = useState(byHandle[start]?.price || 9999);
  const [ans, setAns] = useState({ buyer: "business", credit: "good", years: "est" });
  const fit = useMemo(() => fitFor(ans, amount), [ans, amount]);
  const [tab, setTab] = useState("subsidy");
  const best = OPTIONS.filter((o) => fit[o.id][0]);
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const showDetails = (id) => { setTab(id); go("how"); };
  const Q = ({ k, label, opts }) => (
    <div className="fi-q">
      <span>{t(label)}</span>
      <div className="fi-seg">{opts.map(([v, l]) => <button key={v} type="button" className={ans[k] === v ? "on" : ""} aria-pressed={ans[k] === v} onClick={() => setAns((a) => ({ ...a, [k]: v }))}>{t(l)}</button>)}</div>
    </div>
  );
  const d = DETAILS[tab];
  const cur = OPTIONS.find((o) => o.id === tab);

  return (
    <div className="fi">
      <section className="fi-hero">
        <div className="fi-wrap fi-hero-grid">
          <div className="fi-intro">
            <p className="fi-kicker">{t("Financing")}</p>
            <h1>{t("Get the machine now. Pay for it as it pays you back.")}</h1>
            <p className="fi-sub">{t("Four ways to spread the cost, from $0-down business loans to installments at checkout.")}</p>
            <ul className="fi-points">
              <li><b>$0</b><span>{t("down payment options")}</span></li>
              <li><b>{t("Minutes")}</b><span>{t("to a decision with ClickLease")}</span></li>
              <li><b>60 {t("mo")}</b><span>{t("longest loan term")}</span></li>
            </ul>
            <div className="fi-cta">
              <button type="button" className="fi-btn" onClick={() => go("options")}>{t("Find my option")}<Icon name="arrow" size={18} /></button>
              <Link to="/pages/sales-consultation" className="fi-btn ghost"><Icon name="calendar" size={18} />{t("Talk it through on a free call")}</Link>
            </div>
            <div className="fi-partners">
              <small>{t("Financing partners")}</small>
              <span>{OPTIONS.map((o) => <img key={o.id} src={img(o.logo, 300)} alt={o.name} />)}</span>
            </div>
          </div>
          <Estimator amount={amount} setAmount={setAmount} handle={handle} setHandle={setHandle} />
        </div>
      </section>

      <section className="fi-sec" id="options">
        <div className="fi-wrap">
          <p className="fi-kicker">{t("Choose your option")}</p>
          <h2 className="fi-h2">{t("Three questions, and we'll show what fits.")}</h2>
          <div className="fi-quiz">
            <Q k="buyer" label="Buying as" opts={[["business", "A business"], ["personal", "An individual"]]} />
            {ans.buyer === "business" && <Q k="credit" label="Credit score" opts={[["good", "600 or higher"], ["building", "Under 600 or not sure"]]} />}
            {ans.buyer === "business" && <Q k="years" label="Time in business" opts={[["est", "2 years or more"], ["new", "Under 2 years"]]} />}
            <p className="fi-quiz-amt">{t("Amount")}: <b>{money(Math.round(amount))}</b> <button type="button" onClick={() => go("estimate")}>{t("Change")}</button></p>
          </div>
          <p className="fi-match" aria-live="polite"><Icon name="check" size={18} />{best.length} {t(best.length === 1 ? "option fits your answers" : "options fit your answers")}</p>
          <ul className="fi-cards">
            {OPTIONS.map((o) => {
              const [ok, why] = fit[o.id];
              return (
                <li key={o.id} className={ok ? "fit" : "nofit"}>
                  <span className={`fi-badge${ok ? "" : " off"}`}>{ok ? <Icon name="check" size={14} /> : null}{t(why)}</span>
                  <div className="fi-logo"><img src={img(o.logo, 400)} alt="" loading="lazy" /></div>
                  <h3>{t(o.name)}</h3>
                  <p className="fi-for">{t(o.for)}</p>
                  <p className="fi-pitch">{t(o.pitch)}</p>
                  <dl>{o.facts.map(([v, l]) => <div key={l}><dt>{t(v)}</dt><dd>{t(l)}</dd></div>)}</dl>
                  <div className="fi-card-btns">
                    {o.apply ? <Link href={o.apply} className="fi-btn sm">{t(o.applyLabel)}</Link> : <Link to="/collections/machines" className="fi-btn sm">{t("Shop machines")}</Link>}
                    <button type="button" className="fi-more" onClick={() => showDetails(o.id)}>{t("How it works")} ↓</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="fi-sec soft" id="how">
        <div className="fi-wrap">
          <p className="fi-kicker">{t("How each option works")}</p>
          <div className="fi-tabs" role="tablist">
            {OPTIONS.map((o) => <button key={o.id} type="button" role="tab" aria-selected={tab === o.id} className={tab === o.id ? "on" : ""} onClick={() => setTab(o.id)}>{t(o.name)}</button>)}
          </div>
          <div className="fi-panel" role="tabpanel">
            <div className="fi-panel-head">
              <div><h3>{t(cur.name)}</h3><p>{t(d.lede)}</p></div>
              {cur.apply ? <Link href={cur.apply} className="fi-btn">{t(cur.applyLabel)}<Icon name="arrow" size={18} /></Link> : <Link to="/collections/machines" className="fi-btn">{t("Shop machines")}<Icon name="arrow" size={18} /></Link>}
            </div>
            {d.points && <ul className="fi-points-grid">{d.points.map(([h, p]) => <li key={h}><h4>{t(h)}</h4><p>{t(p)}</p></li>)}</ul>}
            {d.steps && <ol className="fi-steps">{d.steps.map(([h, p], n) => <li key={h}><span>{n + 1}</span><h4>{t(h)}</h4><p>{t(p)}</p></li>)}</ol>}
            {d.links && <p className="fi-links">{d.links.map(([l, u]) => <Link key={l} href={u}>{t(l)} ↗</Link>)}</p>}
          </div>
        </div>
      </section>

      <section className="fi-sec">
        <div className="fi-wrap fi-faq">
          <div>
            <p className="fi-kicker">{t("Questions")}</p>
            <h2 className="fi-h2">{t("Financing, answered.")}</h2>
            <p className="fi-lede">{t("Still unsure? Our team can walk you through the options and prepare the quote a lender needs.")}</p>
            <Link to="/pages/sales-consultation" className="fi-btn"><Icon name="calendar" size={18} />{t("Book a free call")}</Link>
          </div>
          <div>
            {FAQ.map(([group, items]) => (
              <div key={group} className="fi-faq-group">
                <h3>{t(group)}</h3>
                {items.map(([q, a]) => (
                  <details key={q}>
                    <summary>{t(q)}<Icon name="plus" size={18} /></summary>
                    <p>{t(a)}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fi-end">
        <div className="fi-wrap">
          <div>
            <h2>{t("Not sure which option is right?")}</h2>
            <p>{t("Tell us what you want to buy. We'll help you compare options and prepare the quote for your lender.")}</p>
          </div>
          <div className="fi-end-btns">
            <Link to="/pages/sales-consultation" className="fi-btn light"><Icon name="calendar" size={18} />{t("Book a free call")}</Link>
            <Link href="https://www.1laser.com/pages/contact-us" className="fi-btn ghost-light">{t("Contact our team")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
