import { CartProvider } from "./cart.jsx";
import { useRoute } from "./lib.js";
import { useLang } from "./i18n.js";
import { Footer, Header } from "./components/Chrome.jsx";
import Home from "./pages/Home.jsx";
import Collection from "./pages/Collection.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Compare from "./pages/Compare.jsx";
import Consult from "./pages/Consult.jsx";
import Finance from "./pages/Finance.jsx";
import Assistant from "./components/Assistant.jsx";
import { byHandle } from "./lib.js";

function Page({ path, query }) {
  const [, section, handle] = path.split("/");
  if (section === "collections" && handle) return <Collection key={handle} handle={handle} />;
  if (section === "products" && handle) return <Product handle={handle} />;
  if (section === "search") return <Collection key={`s-${query.get("q")}`} search={query.get("q") || ""} />;
  if (section === "compare") return <Compare />;
  if (section === "pages" && handle === "sales-consultation") return <Consult />;
  if (section === "pages" && handle === "financing") return <Finance key={query.get("p") || ""} query={query} />;
  if (section === "cart") return <Cart />;
  return <Home openFinder={query.has("finder")} />;
}

export default function App() {
  const { path, query } = useRoute();
  const lang = useLang(); // every t() call re-reads the language on re-render
  return (
    <CartProvider>
      {path === "/checkout" ? (
        <Checkout key={lang} />
      ) : (
        <>
          <Header path={path} lang={lang} />
          <main key={`main-${lang}`}><Page path={path} query={query} /></main>
          <Footer key={`footer-${lang}`} />
          {/* Shopping assistant while people are choosing (home, product, collection, search, compare).
              Left out of the single-goal pages: booking, financing, cart and checkout. */}
          {/^\/($|products\/|collections\/|search|compare)/.test(path) && <Assistant key={path.split("/")[2] || "site"} product={path.startsWith("/products/") ? byHandle[path.split("/")[2]] : null} />}
        </>
      )}
    </CartProvider>
  );
}
