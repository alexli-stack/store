import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n.js";
import { asset, byHandle, frontImg, img, money } from "../lib.js";
import { AddButton, Icon, Link } from "./ui.jsx";
import { contact } from "../data/site.js";
import { M, STEPS, rank as rankAll, roundFocus, hasRound, ready } from "./finderRules.js";

const rank = (a) => rankAll(a, (h) => !!byHandle[h], (h) => byHandle[h]?.price || 0);

/* "Find your machine": a compact card in the last cell of the home product grid.
   The questions follow the four-step finder on thunderlaserusa.com (material → work → pieces → shop → machine), adapted to the
   OneLaser line-up. What is different: single-choice steps move on by themselves, every step can be skipped or revisited, the
   current best match is named while you answer, and the card ends as a shoppable product card (reasons, price, 24-month figure,
   add to cart, buy now) instead of sending you to another page.
   The matching rules live in finderRules.js. */

/** Accessories the answers call for: a rotary for round items (not for VertiGo, which has one built in) and an indoor fume filter. */
function addOnsFor(a, key) {
  const out = [];
  if (hasRound(a) && key !== "vertigo") out.push(["Rotary attachment", M[key].tier === 1 ? "multi-function-rotary-axis-57-motor" : "piburn-omni-for-onelaser"]);
  if (a.vent === "in") out.push(["Indoor fume filter", M[key].tier === 1 ? "filtrabox-micro" : "filtrabox-compact-x"]);
  return out.filter(([, h]) => byHandle[h]);
}

const FINANCE_MONTHS = 24; // same illustration as 1laser.com's "24-month payment": price ÷ 24
const monthly = (p) => (p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Idle state of the finder preview: line drawings traced from the straight front views on the 1laser.com home page
   (public/assets/finder-front-*.png), blue lines with the brand-red trim where it sits on each machine.
   Every 3 s a laser head sweeps across and engraves the next machine in, with its name and three key specs from the
   catalog. Pure CSS, so outline, laser and label share one clock. */
const SHAPES = [
  { name: "XRF", art: "xrf", specs: [["Laser", "38W RF"], ["Work area", "23.6 × 11.8 in"], ["Speed", "1,200 mm/s"]] },
  { name: "Cobra", art: "cobra", specs: [["Laser", "90–130W CO₂"], ["Work area", "up to 55 × 35 in"], ["Speed", "1,200 mm/s"]] },
  { name: "Hydra Gen2", art: "hydra", specs: [["Laser", "70W RF / hybrid"], ["Work area", "up to 63 × 39 in"], ["Speed", "2,000 mm/s · 4G"]] },
  { name: "VertiGo", art: "vertigo", specs: [["Laser", "38W RF"], ["Fits", "Ø 16–230 mm"], ["Speed", "800 mm/s"]] },
];
const DUR = 12; // whole cycle; each machine gets a quarter

function MachineMorph() {
  return (
    <div className="fx-morph" aria-hidden="true" style={{ "--dur": `${DUR}s`, "--step": `${DUR / SHAPES.length}s` }}>
      <div className="fx-art">
        {SHAPES.map((x, n) => (
          <img key={x.art} src={asset(`finder-front-${x.art}.png`)} alt="" className="fv" style={{ animationDelay: `${(n * DUR) / SHAPES.length}s` }} />
        ))}
        <span className="fx-beam" />
      </div>
      <div className="fx-ms">
        {SHAPES.map((x, n) => (
          <div key={x.name} className="fx-ms-item" style={{ animationDelay: `${(n * DUR) / SHAPES.length}s` }}>
            <b>{x.name}</b>
            <dl>{x.specs.map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Machine finder: spans two cells of the home product grid (one row below on phones).
    Left: one question at a time with a labelled stepper. Right: the best match so far, which updates with every answer,
    so the visitor sees where the answers lead before the end. When done, the card shows the pick and the full
    result opens under the grid (FinderResult). */
const memo = { answers: {}, step: 0 };

/* modal: the finder opened from a home-page dialog. Its details render into the dialog (#fc-result-modal) and every
   scroll stays inside the dialog, so the page underneath never moves. */
/* Confetti for the reveal: 64 pieces thrown out from behind the machine on a golden-angle spread, mostly upward,
   then falling and spinning. Fixed positions (no randomness) so every reveal looks the same. */
const CONFETTI = Array.from({ length: 64 }, (_, i) => {
  const a = (i * 137.5 * Math.PI) / 180;
  const r = 55 + ((i * 53) % 185);
  return {
    k: ["c-red", "c-sky", "c-gold", "c-green", "c-pink"][i % 5] + (i % 3 === 0 ? " dot" : i % 3 === 1 ? " strip" : ""),
    v: { "--x": `${Math.round(Math.cos(a) * r)}px`, "--y": `${Math.round(Math.sin(a) * r * 0.8 - 40)}px`, "--s": `${((i * 97) % 720) - 360}deg`, "--d": `${(1.1 + (i % 5) * 0.14).toFixed(2)}s`, "--w": `${(i % 4) * 0.035}s` },
  };
});

export default function FinderCard({ modal = false }) {
  const scope = modal ? ".tdlg .fx" : ".ih-products .fx";
  const [answers, setAnswersRaw] = useState(memo.answers);
  const [step, setStepRaw] = useState(memo.step);
  const setAnswers = (v) => { memo.answers = v; setAnswersRaw(v); };
  const setStep = (v) => setStepRaw((s) => { const n = typeof v === "function" ? v(s) : v; memo.step = n; return n; });
  const [slot, setSlot] = useState(null);
  const [lead, setLead] = useState(null);
  useEffect(() => setSlot(document.getElementById(modal ? "fc-result-modal" : "fc-result")), [modal]);
  const done = step >= STEPS.length;
  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const ranked = useMemo(() => rank(answers), [answers]);
  const lines = summary(answers);
  const answered = lines.length > 0;
  const top = ranked[0] && byHandle[M[ranked[0].key].handle];
  const has = (s) => (s.multi ? (answers[s.id] || []).length > 0 : !!answers[s.id]);
  const reveal = () => setTimeout(() => document.getElementById(modal ? "fc-result-modal" : "fc-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  /* After "See my match", park the whole result card just under the sticky header and tabs, so the buy buttons and the
     expert-call CTA are in view; the details below are one tap away ("Specs and good to know"). */
  const cardTarget = () => {
    const card = document.querySelector(scope);
    if (!card) return null;
    const bar = document.querySelector(".ih-sticky");
    const under = bar ? parseFloat(getComputedStyle(bar).top) + bar.offsetHeight : 80;
    const top = card.getBoundingClientRect().top + window.scrollY - under - 16; // card top just under the tabs
    const cta = card.querySelector(".fx-call-cta");
    const low = cta ? cta.getBoundingClientRect().bottom + window.scrollY - window.innerHeight + 16 : top; // CTA bottom on screen
    const name = card.querySelector(".fx-name");
    const cap = name ? name.getBoundingClientRect().top + window.scrollY - under - 8 : low; // never hide the machine's name
    // short screens: show as much of the card as fits, but the name always stays below the tabs
    return Math.max(0, Math.min(Math.max(top, low), cap));
  };
  /* One smooth scroll, computed once; nothing scrolls the page again afterwards (scroll anchoring is off around the
     finder in CSS, so the card swap cannot push the page either). */
  const showCard = () => setTimeout(() => {
    if (modal) { document.querySelector(scope)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const y = cardTarget();
    if (y != null) window.scrollTo({ top: y, behavior: "smooth" });
  }, 120);
  const finish = () => { setStep(STEPS.length); showCard(); };
  const pick = (id) => {
    if (cur.multi) {
      const set = answers[cur.id] || [];
      setAnswers({ ...answers, [cur.id]: set.includes(id) ? set.filter((x) => x !== id) : [...set, id] });
    } else {
      setAnswers({ ...answers, [cur.id]: id });
      const last = STEPS.indexOf(cur) === STEPS.length - 1;
      setTimeout(() => { setStep((s) => Math.max(s, STEPS.indexOf(cur) + 1)); if (last) showCard(); }, 260);
    }
  };
  const reset = () => { setAnswers({}); setStep(0); };
  const edit = (n) => { setStep(n); document.querySelector(scope)?.scrollIntoView({ behavior: "smooth", block: modal ? "start" : "center" }); };
  const leadDialog = lead && <LeadDialog mode={lead} product={answered ? top : null} lines={lines} onClose={() => setLead(null)} />;

  const stepper = (
    <ol className="fx-steps" aria-label={t("Progress")}>
      {STEPS.map((s, n) => {
        const state = n === step ? "on" : has(s) ? "done" : n < step ? "skip" : "";
        return (
          <li key={s.id} className={state}>
            <button type="button" onClick={() => setStep(n)} aria-current={n === step ? "step" : undefined} disabled={n > step && (!has(s) || STEPS.slice(0, n).some((x) => x.required && !has(x)))}>
              <i>{has(s) && n !== step ? <Icon name="check" size={11} /> : n + 1}</i><span>{t(s.short)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  if (done && top) {
    const reasons = answered ? ranked[0].reasons : [];
    return (
      <article className="fx fx-done" aria-live="polite">
        <div className="fx-main">
          <p className="fx-kicker"><Icon name="check" size={14} />{t("Your match is ready")}</p>
          <p className="fx-sub">{fill(t("Based on {n} of {total} answers"), { n: lines.length, total: STEPS.length })}</p>
          <h3 className="fx-name"><Link to={`/products/${top.handle}`}>{top.name}</Link></h3>
          <p className="fx-tag">{top.tagline}</p>
          {reasons.length > 0 && <ul className="fx-why">{reasons.map((r) => <li key={r}><Icon name="check" size={14} />{t(r)}</li>)}</ul>}
          <p className="fx-price"><b>{money(top.price)}</b>{top.compareAt > top.price && <><s>{money(top.compareAt)}</s><em>{t("Save")} {money(top.compareAt - top.price)}</em></>}<span>{t("or")} ${monthly(top)}{t("/mo for 24 months")}</span></p>
          <div className="fx-cta">
            <AddButton product={top} className="ih-btn line" />
            <Link to={`/products/${top.handle}`} className="ih-btn dark">{t("Buy now")}</Link>
          </div>
          <Link to="/pages/sales-consultation" className="fx-call-cta">
            <span className="fx-call-ico"><Icon name="calendar" size={18} /></span>
            <span><b>{t("Want to talk it through first?")}</b><em>{t("Book a free 30-minute call with a laser expert")}</em></span>
            <Icon name="arrow" size={18} />
          </Link>
          <p className="fx-foot">
            <button type="button" onClick={() => edit(STEPS.length - 1)}>← {t("Change answers")}</button>
            <button type="button" onClick={reset}>↺ {t("Start over")}</button>
            <button type="button" onClick={reveal}>{t("Specs and good to know")} ↓</button>
          </p>
        </div>
        {/* the reveal: the picked machine rises onto the stage, a laser line sweeps it once and a few sparks burst out */}
        <Link to={`/products/${top.handle}`} className="fx-stage" tabIndex={-1} aria-hidden="true" key={top.handle}>
          <span className="fx-pick-chip"><Icon name="sparkle" size={14} />{t("Picked for you")}</span>
          <span className="fx-burst"><b className="fx-flash" />{CONFETTI.map((c, i) => <i key={i} className={c.k} style={c.v} />)}</span>
          <span className="fx-scan" />
          <img src={img(frontImg(top), 900)} alt="" />
        </Link>
        {slot && createPortal(<FinderResult answers={answers} ranked={ranked} />, slot)}
        {leadDialog}
      </article>
    );
  }

  return (
    <article className="fx">
      <div className="fx-main">
        <div className="fx-top">
          <p className="fx-kicker"><Icon name="search" size={14} />{t("Find your machine")}</p>
          <span className="fx-time">{t("6 quick questions · about 30 seconds")}</span>
        </div>
        {stepper}
        <div className="fx-q" key={cur.id}>
          <p className="fx-count">{fill(t("Question {n} of {total}"), { n: step + 1, total: STEPS.length })} · <span className={cur.required ? "req" : ""}>{t(cur.required ? "Required" : "Optional")}</span></p>
          <h3>{t(cur.title)}</h3>
          <p className="fx-hint">{t(cur.hint)}</p>
          <div className={`fx-options${cur.options.length > 3 ? " grid" : ""}`} role={cur.multi ? "group" : "radiogroup"} aria-label={t(cur.title)}>
            {cur.options.map(([id, label, sub]) => {
              const on = cur.multi ? (answers[cur.id] || []).includes(id) : answers[cur.id] === id;
              return (
                <button key={id} type="button" role={cur.multi ? "checkbox" : "radio"} aria-checked={on} className={on ? "on" : ""} onClick={() => pick(id)}>
                  <span><b>{t(label)}</b>{sub && <em>{t(sub)}</em>}</span>
                  <i aria-hidden="true"><Icon name="check" size={12} /></i>
                </button>
              );
            })}
          </div>
        </div>
        <div className="fx-nav">
          {step > 0 ? <button type="button" className="fx-link" onClick={() => setStep(step - 1)}>← {t("Back")}</button> : <span />}
          <span className="fx-nav-r">
            {!cur.required && !has(cur) && <button type="button" className="fx-link" onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}>{t("Skip")}</button>}
            {cur.multi && <button type="button" className="ih-btn dark sm" disabled={!has(cur)} onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}>{t("Continue")} →</button>}
            {!cur.multi && has(cur) && step < STEPS.length - 1 && <button type="button" className="fx-link" onClick={() => setStep(step + 1)}>{t("Next")} →</button>}
            {ready(answers) && step < STEPS.length - 1 && <button type="button" className="fx-link strong" onClick={finish}>{t("See my match")}</button>}
          </span>
        </div>
      </div>
      <aside className={`fx-peek${answered ? " live" : ""}`} aria-live="polite">
        <p className="fx-peek-label">{answered ? t("Best match so far") : t("Your match appears here")}</p>
        {!answered && <MachineMorph />}
        {answered && top && (
          <Link to={`/products/${top.handle}`} className="fx-peek-card" key={top.handle}>
            <span className="fx-peek-img"><img src={img(frontImg(top), 600)} alt="" /></span>
            <b>{top.name}</b>
            <span className="fx-peek-price">{money(top.price)}{top.compareAt > top.price && <s>{money(top.compareAt)}</s>}</span>
          </Link>
        )}
        {answered ? (
          <>
            <ul className="fx-peek-why">{ranked[0].reasons.slice(0, 2).map((r) => <li key={r}><Icon name="check" size={12} />{t(r)}</li>)}</ul>
            <p className="fx-meter" aria-hidden="true"><i style={{ width: `${(lines.length / STEPS.length) * 100}%` }} /></p>
          </>
        ) : (
          <p className="fx-peek-note">{t("Your best match updates with every answer.")}</p>
        )}
        <a href={`tel:${contact.tel}`} className="fx-expert"><Icon name="phone" size={14} />{t("Rather talk to an expert?")}</a>
      </aside>
      {leadDialog}
    </article>
  );
}

const SIZE_TEXT = { s: "12 × 12 in.", m: "24 × 12 in.", l: "36 × 24 in.", xl: "51 × 35 in.", xxl: "63 × 39 in." };
const fill = (str, vars) => Object.entries(vars).reduce((out, [k, v]) => out.replace(`{${k}}`, v), str);
const RF_WARRANTY = ["xrf", "hydra7", "hydra9", "hydra13", "hydra16"];

/** What the visitor told the finder, as question → answer lines (shown on the result and sent with a lead). */
function summary(answers) {
  return STEPS.map((s, n) => {
    const v = answers[s.id];
    const ids = Array.isArray(v) ? v : v ? [v] : [];
    if (!ids.length) return null;
    return { n, q: s.title, label: s.label, a: ids.map((id) => s.options.find((o) => o[0] === id)?.[1]).filter(Boolean) };
  }).filter(Boolean);
}

/** "Good to know": plain notes built only from catalog facts (work areas, prices, accessories) and the published warranty. */
function notesFor(answers, key, product) {
  const out = [];
  const mats = answers.material || [];
  const round = mats.includes("drinkware") || answers.round === "some" || answers.round === "most";
  const area = product.specs?.["Work area"];
  if (answers.size && key !== "vertigo" && area) out.push(fill(t("Your largest piece (up to {size}) fits inside its {area} work area."), { size: SIZE_TEXT[answers.size], area }));
  if (round && key === "vertigo") out.push(fill(t("The rotary is built in: {range}."), { range: product.specs?.["Key capability"] || "" }));
  if (key === "vertigo" && byHandle[M.xrf.handle]) out.push(fill(t("VertiGo only engraves round items. For flat pieces like signs or coasters, pair it with a flatbed such as the {name} ({price})."), { name: byHandle[M.xrf.handle].name, price: money(byHandle[M.xrf.handle].price) }));
  addOnsFor(answers, key).forEach(([label, h]) => {
    const a = { ...byHandle[h], name: byHandle[h].name.split(/ [–-] /)[0] };
    if (label === "Rotary attachment") out.push(fill(t("Round items need a rotary, sold separately: {name} ({price})."), { name: a.name, price: money(a.price) }));
    else out.push(fill(t("No outside vent? The {name} ({price}) is the indoor fume filter we pair with it."), { name: a.name, price: money(a.price) }));
  });
  if (roundFocus(answers) && key !== "vertigo" && byHandle[M.vertigo.handle]) {
    const v = byHandle[M.vertigo.handle];
    out.push(fill(t("Mostly tumblers? {name} ({price}) has a vertical rotary built in."), { name: v.name, price: money(v.price) }));
  }
  const family = Object.entries(M).filter(([k, m]) => k.replace(/\d+$/, "") === key.replace(/\d+$/, "") && m.w > M[key].w).sort((x, y) => x[1].w - y[1].w)[0];
  const bigger = family && byHandle[family[1].handle];
  if (bigger) out.push(fill(t("Room to grow: the {name} ({area}) is {price}."), { name: bigger.name, area: bigger.specs?.["Work area"] || "", price: money(bigger.price) }));
  return out;
}

const BUDGETS = ["Under $3k", "$3k–$5k", "$5k–$10k", "$10k+"];
const CODES = [["+1", "US"], ["+44", "UK"], ["+61", "AU"], ["+49", "DE"], ["+33", "FR"], ["+34", "ES"], ["+81", "JP"], ["+86", "CN"]];

/** Lead form in a dialog over the page, laid out after the 1laser.com Black Friday "Talk to a laser expert" pop-up.
    Design draft: nothing is stored or sent. */
export function LeadDialog({ mode = "quote", product, lines = [], onClose }) {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState({});
  const first = useRef(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first.current?.focus();
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [onClose]);
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const bad = {};
    if (!String(f.get("name") || "").trim()) bad.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.get("email") || ""))) bad.email = true;
    if (!f.get("budget")) bad.budget = true;
    if (mode === "call" && String(f.get("phone") || "").replace(/\D/g, "").length < 6) bad.phone = true;
    setErr(bad);
    if (!Object.keys(bad).length) setSent(true);
  };
  const call = mode === "call";
  return createPortal(
    <div className="lead" role="dialog" aria-modal="true" aria-labelledby="lead-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lead-box">
        <button type="button" className="lead-x" aria-label={t("Close")} onClick={onClose}>×</button>
        <div className="lead-art">
          <img src={asset("home-bf-lineup.jpg")} alt="" />
          {product && <p className="lead-pick"><span>{t("Your pick")}</span><b>{product.name}</b><em>{money(product.price)}{product.compareAt > product.price && <s>{money(product.compareAt)}</s>}</em></p>}
          <p className="lead-tag">{t("Up to")} <b>$3,000</b> {t("off")}</p>
        </div>
        {sent ? (
          <div className="lead-body lead-done" role="status">
            <span className="lead-ok"><Icon name="check" size={30} /></span>
            <h2 id="lead-title">{t("Thanks — this is a design draft")}</h2>
            <p>{t("This form is not connected yet, so nothing was sent. On the live site a OneLaser laser expert would follow up by email or phone.")}</p>
            <p>{t("Prefer to talk now? Call")} <a href={`tel:${contact.tel}`}>{contact.phone}</a></p>
            <button type="button" className="lead-submit" onClick={onClose}>{t("Back to my result")}</button>
          </div>
        ) : (
          <form className="lead-body" onSubmit={submit} noValidate>
            <h2 id="lead-title">{t(call ? "Talk to a laser expert" : "Get a written quote")}</h2>
            <p className="lead-lede">
              {t(call ? "Leave your details and a OneLaser laser expert will call you about this machine." : "A OneLaser laser expert reviews your answers and sends a written quote with pricing, accessories and delivery.")}{" "}
              {t("Or call")} <a href={`tel:${contact.tel}`}>{contact.phone}</a>.
            </p>
            <label className={`lead-field${err.name ? " bad" : ""}`}><span>{t("Name")} *</span><input ref={first} name="name" autoComplete="name" /></label>
            <label className={`lead-field${err.email ? " bad" : ""}`}><span>{t("Email")} *</span><input name="email" type="email" autoComplete="email" inputMode="email" /></label>
            <div className={`lead-field${err.phone ? " bad" : ""}`}>
              <span>{t(call ? "Phone" : "Phone (optional)")}{call && " *"}</span>
              <div className="lead-phone">
                <select name="code" aria-label={t("Country code")} defaultValue="+1">{CODES.map(([c, r]) => <option key={c} value={c}>{c} {r}</option>)}</select>
                <input name="phone" type="tel" autoComplete="tel-national" inputMode="tel" aria-label={t("Phone number")} required={call} />
              </div>
            </div>
            <fieldset className={`lead-budget${err.budget ? " bad" : ""}`}>
              <legend>{t("What is your budget for the machine?")} *</legend>
              <div>{BUDGETS.map((b) => <label key={b}><input type="radio" name="budget" value={b} /><span>{t(b)}</span></label>)}</div>
            </fieldset>
            <label className="lead-field"><span>{t("Anything else? (optional)")}</span><textarea name="note" rows={2} placeholder={t("Quantities, materials, deadlines…")} /></label>
            {lines.length > 0 && (
              <details className="lead-sum">
                <summary>{t("Sent with your request")} · {lines.length + (product ? 1 : 0)}</summary>
                <ul>
                  {lines.map((l) => <li key={l.q}><span>{t(l.q)}</span><b>{l.a.map((x) => t(x)).join(", ")}</b></li>)}
                  {product && <li><span>{t("Finder pick")}</span><b>{product.name} ({money(product.price)})</b></li>}
                </ul>
              </details>
            )}
            {Object.keys(err).length > 0 && <p className="lead-err" role="alert">{t("Please fill in the fields marked *.")}</p>}
            <button type="submit" className="lead-submit">{t(call ? "Request a call" : "Email me a written quote")}</button>
            <p className="lead-fine">{t("By submitting, you agree to receive follow-ups from the OneLaser team (human or AI) by email, phone, or text regarding your inquiry.")} {t("Never share sensitive information (credit card numbers, social security numbers, passwords) through this form.")}</p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Full-width result under the product grid, after the result panel of the thunderlaserusa.com finder:
    our pick with why it fits, key specs, good-to-know notes, warranty, then buy and lead buttons. */
function FinderResult({ answers, ranked }) {
  const [lead, setLead] = useState(null);
  // Details under the result card: the pick itself (photo, price, buttons) is shown once, in the card above.
  const key = ranked[0].key;
  const top = byHandle[M[key].handle];
  const alt = ranked[1] && byHandle[M[ranked[1].key].handle];
  const lines = summary(answers);
  const notes = notesFor(answers, key, top);
  const specs = ["Laser source", "Work area", "Max engraving speed", "Acceleration"].filter((k) => top.specs?.[k]);
  return (
    <section className="fr" aria-label={t("Specs and good to know")}>
      <ol className="fr-steps">
        {STEPS.map((s, n) => {
          const l = lines.find((x) => x.n === n);
          return (
            <li key={s.id} className={l ? "done" : ""}>
              <span title={l ? l.a.map((x) => t(x)).join(", ") : undefined}>
                <i>{l ? <Icon name="check" size={14} /> : n + 1}</i>
                <span><b>{t(s.label)}</b><em>{l ? l.a.map((x) => t(x)).join(", ") : t("Skipped")}</em></span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="fr-card">
        <div className="fr-col">
          <h3>{fill(t("{name} at a glance"), { name: top.name })}</h3>
          <dl className="fr-specs">{specs.map((k) => <div key={k}><dt>{t(k)}</dt><dd>{top.specs[k]}</dd></div>)}</dl>
          <p className="fr-warranty">
            <Icon name="shield" size={16} />
            {RF_WARRANTY.includes(key) ? t("3-2-1 warranty: 3-year mechanical, 2-year electrical and 1-year optics.") : t("Covered by the official OneLaser warranty policy.")} {t("U.S.-based support from laser engineers.")}
          </p>
          <Link to={`/products/${top.handle}`} className="fr-link">{t("See full specs and reviews")} ›</Link>
        </div>
        <div className="fr-col">
          {notes.length > 0 && (
            <>
              <h3>{t("Good to know")}</h3>
              <ul className="fr-notes">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </>
          )}
          {alt && (
            <Link to={`/products/${alt.handle}`} className="fr-alt">
              <img src={img(frontImg(alt), 300)} alt="" loading="lazy" />
              <span><em>{t("Also worth a look")}</em><b>{alt.name}</b><i>{money(alt.price)}</i></span>
              <Icon name="chevron" size={16} />
            </Link>
          )}
        </div>
      </div>
      <div className="fr-lead">
        <div>
          <h3>{t("Not ready to order yet?")}</h3>
          <p>{fill(t("Get a written quote for the {name} with your answers attached, or talk it through with a laser expert."), { name: top.name })}</p>
        </div>
        <div className="fr-lead-btns">
          <button type="button" className="fx-quote" onClick={() => setLead("quote")}><Icon name="mail" size={16} />{t("Email me a written quote")}</button>
          <a href={`tel:${contact.tel}`} className="fx-call"><Icon name="phone" size={16} />{t("Talk to a laser expert")}</a>
        </div>
      </div>
      {lead && <LeadDialog mode={lead} product={top} lines={lines} onClose={() => setLead(null)} />}
    </section>
  );
}

/** Links and the "talk to us" card under the grid, after the same block on thunderlaserusa.com. */
export function FinderHelp() {
  return (
    <>
      <p className="fd-links">
        <Link to="/compare">{t("Compare every spec")} ›</Link>
        <Link to="/pages/financing">{t("Pricing and financing")} ›</Link>
      </p>
      <div className="fd-help">
        <span className="fd-faces" aria-hidden="true">{[1, 2, 3].map((n) => <img key={n} src={asset(`team-${n}.jpg`)} alt="" loading="lazy" />)}</span>
        <div>
          <h3>{t("Not sure which one fits?")}</h3>
          <p>{t("Talk it through with a OneLaser laser engineer. Tell us what you make and we'll point you to the right machine.")}</p>
        </div>
        <Link to="/pages/sales-consultation" className="ih-btn dark">{t("Schedule a call")}</Link>
      </div>
    </>
  );
}
