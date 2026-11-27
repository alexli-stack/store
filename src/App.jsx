import { lazy, Suspense } from "react";
import { CartProvider } from "./cart.jsx";
import { byHandle, useRoute } from "./lib.js";
import { useLang } from "./i18n.js";
import { Footer, Header } from "./components/Chrome.jsx";
import Home from "./pages/Home.jsx";
import Assistant from "./components/Assistant.jsx";

const Collection = lazy(() => import("./pages/Collection.jsx"));
const Product = lazy(() => import("./pages/Product.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
const Consult = lazy(() => import("./pages/Consult.jsx"));
const Finance = lazy(() => import("./pages/Finance.jsx"));

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
        <Suspense fallback={null}><Checkout key={lang} /></Suspense>
      ) : (
        <>
          <Header path={path} lang={lang} />
          <main key={`main-${lang}`}><Suspense fallback={null}><Page path={path} query={query} /></Suspense></main>
          <Footer key={`footer-${lang}`} />
          {/* Shopping assistant while people are choosing (home, product, collection, search, compare).
              Left out of the single-goal pages: booking, financing, cart and checkout. */}
          {/^\/($|products\/|collections\/|search|compare)/.test(path) && <Assistant key={path.split("/")[2] || "site"} home={path === "/"} product={path.startsWith("/products/") ? byHandle[path.split("/")[2]] : null} />}
        </>
      )}
    </CartProvider>
  );
}
