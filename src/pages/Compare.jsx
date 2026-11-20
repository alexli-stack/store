import { img, machines, money } from "../lib.js";
import { t } from "../i18n.js";
import { Link } from "../components/ui.jsx";

export default function Compare() {
  const list = machines.filter((m) => m.series !== "legacy");
  const rows = Object.keys(list[0].specs);
  return (
    <section className="collection">
      <div className="collection-container">
        <nav className="breadcrumbs"><Link to="/">{t("Home")}</Link><span>/</span><b>{t("Compare machines")}</b></nav>
        <header className="collection-intro"><h1>{t("Compare machines")}</h1><p>{t("Every current OneLaser machine, side by side.")}</p></header>
        <div className="compare-scroll table">
          <table className="compare-table">
            <thead>
              <tr>
                <th />
                {list.map((m) => (
                  <th key={m.handle}>
                    <Link to={`/products/${m.handle}`}><img src={img(m.images[0], 300)} alt="" loading="lazy" /><b>{m.name}</b></Link>
                    <span>{t("From")} USD {money(m.price)}</span>
                    <Link to={`/products/${m.handle}`} className="compare-btn">{t("Buy Now")}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th>{t("Best for")}</th>{list.map((m) => <td key={m.handle}>{m.bestFor}</td>)}</tr>
              {rows.map((r) => <tr key={r}><th>{r}</th>{list.map((m) => <td key={m.handle}>{m.specs[r]}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
