import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { byHandle } from "./lib.js";

const CartContext = createContext(null);
const KEY = "onelaser-store-cart-v1";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load); // [{handle, variantId, qty}]
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const value = useMemo(() => {
    const items = lines
      .map((l) => {
        const product = byHandle[l.handle];
        const variant = product?.variants.find((v) => v.id === l.variantId);
        return product && variant ? { ...l, product, variant, total: variant.price * l.qty } : null;
      })
      .filter(Boolean);
    // Lines can be ticked off in the cart (Insta360 style): totals and checkout use the ticked lines only.
    const picked = items.filter((i) => !i.off);
    const sum = (list) => list.reduce((s, i) => s + i.total, 0);
    const save = (list) => list.reduce((s, i) => s + (i.variant.compareAt ? (i.variant.compareAt - i.variant.price) * i.qty : 0), 0);
    const subtotal = sum(picked);
    const savings = save(picked);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const add = (handle, variantId, qty = 1) => {
      setLines((prev) => {
        const hit = prev.find((l) => l.variantId === variantId);
        return hit ? prev.map((l) => (l === hit ? { ...l, qty: l.qty + qty, off: false } : l)) : [...prev, { handle, variantId, qty }];
      });
    };
    const toggle = (variantId) => setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, off: !l.off } : l)));
    const toggleAll = (on) => setLines((prev) => prev.map((l) => ({ ...l, off: !on })));
    const clearPicked = () => setLines((prev) => prev.filter((l) => l.off));
    const setQty = (variantId, qty) =>
      setLines((prev) => (qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l))));
    const clear = () => setLines([]);
    return { items, picked, subtotal, savings, count, add, setQty, clear, toggle, toggleAll, clearPicked };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
