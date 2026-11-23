import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n.js";
import { asset, byHandle, frontImg, img, lockScroll, money } from "../lib.js";
import { AddButton, Icon, Link } from "./ui.jsx";
import { contact } from "../data/site.js";
import { M, STEPS, rank as rankAll, hasRound, ready } from "./finderRules.js";

const rank = (a) => rankAll(a, (h) => !!byHandle[h], (h) => byHandle[h]?.price || 0);

// The matching rules for the home machine finder live in finderRules.js.

/** Accessories the answers call for: a rotary for round items (not for VertiGo, which has one built in) and an indoor fume filter. */
function addOnsFor(a, key) {
  const out = [];
  if (hasRound(a) && key !== "vertigo") out.push(["Rotary attachment", M[key].tier === 1 ? "multi-function-rotary-axis-57-motor" : "piburn-omni-for-onelaser"]);
  if (a.vent === "in") out.push(["Indoor fume filter", M[key].tier === 1 ? "filtrabox-micro" : "filtrabox-compact-x"]);
  return out.filter(([, h]) => byHandle[h]);
}

const FINANCE_MONTHS = 24; // same illustration as 1laser.com's "24-month payment": price ÷ 24
const monthly = (p) => (p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STAGES = [
  { label: "Your material", questions: ["material"] },
  { label: "Your work", questions: ["work"] },
  { label: "Your pieces", questions: ["size", "round"] },
  { label: "Your shop", questions: ["shop", "vent"] },
].map(({ label, questions }) => ({ label, questions: questions.map((id) => STEPS.find((question) => question.id === id)) }));
const FINISHED = STAGES.length;
const hasAnswer = (answer) => Array.isArray(answer) ? answer.length > 0 : Boolean(answer);

// Keep answers when the visitor opens a product and then comes back to the finder.
const memo = { answers: {}, stage: 0 };

function FinderProgress({ stage, answers, onEdit }) {
  return (
    <ol className="fx-steps" aria-label={t("Progress")} style={{ "--progress": stage / STAGES.length * 100 + "%" }}>
      {[...STAGES.map(({ label }) => label), "Your machine"].map((label, i) => {
        const canEdit = i < stage;
        const completed = canEdit && STAGES[i].questions.some(({ id }) => hasAnswer(answers[id]));
        const current = i === stage;
        const content = (
          <>
            <span className="fx-step-number" aria-hidden="true">
              {completed ? <Icon name="check" size={15} /> : i === STAGES.length ? <Icon name="sparkle" size={16} /> : i + 1}
            </span>
            <span className="fx-step-label">{t(label)}</span>
          </>
        );
        return (
          <li key={label} className={completed ? "done" : undefined} aria-current={current ? "step" : undefined}>
            {canEdit ? <button type="button" onClick={() => onEdit(i)}>{content}</button> : content}
          </li>
        );
      })}
    </ol>
  );
}

function FinderQuestion({ question, grouped, selection, onChange }) {
  const { id, required, multi, hint, options } = question;
  const titleId = grouped ? `finder-group-${id}` : "finder-question";
  const hintId = `finder-hint-${id}`;
  const label = id === "size" ? "Largest piece" : question.short;
  const selected = multi ? selection || [] : null;
  const canClear = hasAnswer(selection);
  const pick = (value, checked) => {
    if (!multi) {
      onChange(id, value);
      return;
    }
    onChange(id, checked ? [...selected, value] : selected.filter((item) => item !== value));
  };

  return (
    <div className="fx-question-group">
      {grouped && (
        <div className="fx-group-heading">
          <h4 id={titleId}>{t(label)}</h4>
          <span className="fx-group-status">{t(required ? "Required" : "Optional")}</span>
          {!required && (
            <button
              type="button"
              className="fx-clear"
              aria-disabled={!canClear}
              aria-describedby={titleId}
              tabIndex={canClear ? 0 : -1}
              onClick={() => { if (canClear) onChange(id, undefined); }}
            >{t("Clear selection")}</button>
          )}
        </div>
      )}
      <p className="fx-hint" id={hintId}>{t(hint)}</p>
      <fieldset className="fx-options" aria-labelledby={titleId} aria-describedby={hintId}>
        {options.map(([value, text, detail]) => (
          <label className="fx-option" key={value}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={id}
              checked={multi ? selected.includes(value) : selection === value}
              onChange={(event) => pick(value, event.target.checked)}
            />
            <span className="fx-option-copy"><b>{t(text)}</b>{detail && <small>{t(detail)}</small>}</span>
            <span className="fx-option-mark" aria-hidden="true"><Icon name="check" size={13} /></span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function FinderCard() {
  const [answers, setAnswers] = useState(memo.answers);
  const [stage, setStage] = useState(memo.stage);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const resultRef = useRef(null);
  const shouldFocus = useRef(false);
  const done = stage === FINISHED;
  const { label, questions } = STAGES[stage] || {};
  const grouped = questions?.length > 1;
  const last = stage === FINISHED - 1;
  const canContinue = last ? ready(answers) : questions?.every(({ id, required }) => !required || hasAnswer(answers[id]));
  const ranked = done ? rank(answers) : [];
  const top = ranked[0] && byHandle[M[ranked[0].key].handle];

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    const card = cardRef.current;
    titleRef.current?.focus({ preventScroll: true });
    const top = card.getBoundingClientRect().top;
    const offset = parseFloat(getComputedStyle(card).scrollMarginTop);
    if (top < offset - 1 || top > window.innerHeight * 0.5) {
      card.scrollIntoView({ block: "start" });
    }
  }, [stage]);

  const saveAnswers = (next) => {
    memo.answers = next;
    setAnswers(next);
  };
  const goTo = (next) => {
    if (next === stage) return;
    shouldFocus.current = true;
    memo.stage = next;
    setStage(next);
  };
  const setAnswer = (id, value) => saveAnswers({ ...answers, [id]: value });
  const startOver = () => {
    saveAnswers({});
    goTo(0);
  };

  return (
    <>
      <article ref={cardRef} className="fx">
        <FinderProgress stage={stage} answers={answers} onEdit={goTo} />
        {done ? (
          <>
            {top ? (
              <div className="fx-done">
                <div className="fx-main">
                  <p className="fx-kicker"><Icon name="check" size={15} />{t("Your match is ready")}</p>
                  <h3 ref={titleRef} tabIndex={-1} className="fx-name"><Link to={`/products/${top.handle}`}>{top.name}</Link></h3>
                  <p className="fx-tag">{top.tagline}</p>
                  <ul className="fx-why">
                    {ranked[0].reasons.map((reason) => <li key={reason}><Icon name="check" size={15} />{t(reason)}</li>)}
                  </ul>
                  <p className="fx-price">
                    <b>{money(top.price)}</b>
                    {top.compareAt > top.price && <><s>{money(top.compareAt)}</s><em>{t("Save")} {money(top.compareAt - top.price)}</em></>}
                    <span>{t("or")} ${monthly(top)}{t("/mo for 24 months")}</span>
                  </p>
                  <div className="fx-cta">
                    <AddButton product={top} className="ih-btn line" />
                    <Link to={`/products/${top.handle}`} className="ih-btn dark">{t("Buy now")}</Link>
                  </div>
                  <Link to="/pages/sales-consultation" className="fx-call-cta">
                    <span className="fx-call-ico"><Icon name="calendar" size={20} tone /></span>
                    <span><b>{t("Want to talk it through first?")}</b><em>{t("Book a free 30-minute call with a laser expert")}</em></span>
                    <Icon name="arrow" size={18} />
                  </Link>
                </div>
                <div className="fx-stage">
                  <img src={img(frontImg(top), 900)} alt={top.name} width="900" height="600" />
                </div>
              </div>
            ) : (
              <div className="fx-q">
                <h3 ref={titleRef} tabIndex={-1}>{t("Not sure which one fits?")}</h3>
                <Link to="/pages/sales-consultation" className="ih-btn dark">{t("Talk to a laser expert")}</Link>
              </div>
            )}
            <div className="fx-foot">
              <button type="button" onClick={() => goTo(0)}>← {t("Change answers")}</button>
              <button type="button" onClick={startOver}>{t("Start over")}</button>
              {top && <button type="button" onClick={() => resultRef.current?.scrollIntoView({ block: "start" })}>{t("Specs and good to know")} ↓</button>}
            </div>
          </>
        ) : (
          <>
            <div className="fx-q" key={stage}>
              <p className="fx-count">{fill(t("Step {n} of {total}"), { n: stage + 1, total: STAGES.length })}{!grouped && ` · ${t(label)}`}</p>
              <h3 id="finder-question" ref={titleRef} tabIndex={-1}>{t(grouped ? label : questions[0].title)}</h3>
              <div className={grouped ? "fx-question-groups" : undefined}>
                {questions.map((question) => <FinderQuestion key={question.id} question={question} grouped={grouped} selection={answers[question.id]} onChange={setAnswer} />)}
              </div>
            </div>
            <div className="fx-nav">
              {stage > 0 && <button type="button" className="fx-link" onClick={() => goTo(stage - 1)}>← {t("Back")}</button>}
              <button type="button" className="fx-next" disabled={!canContinue} onClick={() => goTo(stage + 1)}>
                {t(last ? "See my match" : "Continue")} <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="fx-foot">
              <a href={`tel:${contact.tel}`}><Icon name="phone" size={15} />{t("Rather talk to an expert?")}</a>
            </div>
          </>
        )}
      </article>
      {top && <div ref={resultRef} id="fc-result"><FinderResult answers={answers} ranked={ranked} /></div>}
    </>
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
function notesFor(answers, key, product, ranked) {
  const out = [];
  const area = product.specs?.["Work area"];
  if (answers.size && key !== "vertigo" && area) out.push(fill(t("The machine has a {area} work area. Your selected piece is up to {size}"), { size: SIZE_TEXT[answers.size], area }));
  if (key === "vertigo" && hasRound(answers)) out.push(fill(t("The rotary is built in: {range}."), { range: product.specs?.["Key capability"] || "" }));
  if (key === "vertigo" && byHandle[M.xrf.handle]) out.push(fill(t("VertiGo only engraves round items. For flat pieces like signs or coasters, pair it with a flatbed such as the {name} ({price})."), { name: byHandle[M.xrf.handle].name, price: money(byHandle[M.xrf.handle].price) }));
  addOnsFor(answers, key).forEach(([label, h]) => {
    const a = { ...byHandle[h], name: byHandle[h].name.split(/ [–-] /)[0] };
    if (label === "Rotary attachment") out.push(fill(t("Round items need a rotary, sold separately: {name} ({price})."), { name: a.name, price: money(a.price) }));
    else out.push(fill(t("No outside vent? The {name} ({price}) is the indoor fume filter we pair with it."), { name: a.name, price: money(a.price) }));
  });
  if (key !== "vertigo" && ranked.some((match) => match.key === "vertigo")) {
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
    const unlock = lockScroll();
    first.current?.focus();
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => { unlock(); window.removeEventListener("keydown", key); };
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

/** Specifications, alternatives and consultation options below the matched machine. */
function FinderResult({ answers, ranked }) {
  const [lead, setLead] = useState(null);
  // Details under the result card: the pick itself (photo, price, buttons) is shown once, in the card above.
  const key = ranked[0].key;
  const top = byHandle[M[key].handle];
  const alt = ranked[1] && byHandle[M[ranked[1].key].handle];
  const lines = summary(answers);
  const notes = notesFor(answers, key, top, ranked);
  const specs = ["Laser source", "Work area", "Max engraving speed", "Acceleration"].filter((k) => top.specs?.[k]);
  return (
    <section className="fr" aria-label={t("Specs and good to know")}>
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

/** Comparison, financing and consultation links below the finder. */
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
