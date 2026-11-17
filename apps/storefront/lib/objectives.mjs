/** Generic editorial selections: no niche-specific calculations. */
export function objectiveItems(objective, products) {
  return (Array.isArray(objective?.items) ? objective.items : []).reduce((items, item) => {
    if (!item || typeof item !== "object") return items;
    if (items.some((entry) => entry.slug === item.slug) || !products.some((product) => product.slug === item.slug)) return items;
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) return items;
    return [...items, { slug: item.slug, quantity: item.quantity }];
  }, []);
}
export function mergeSelection(cart, selection, products) {
  const next = cart.map((item) => ({ ...item }));
  for (const item of objectiveItems({ items: selection }, products)) {
    const current = next.find((entry) => entry.slug === item.slug);
    if (current) current.quantity = Math.min(20, current.quantity + item.quantity);
    else next.push(item);
  }
  return next;
}
export function selectionResult(cart, selection, products) {
  const valid = objectiveItems({ items: selection }, products);
  const next = mergeSelection(cart, valid, products);
  const requested = valid.reduce((sum, item) => sum + item.quantity, 0);
  const added = valid.reduce((sum, item) => sum + (next.find((entry) => entry.slug === item.slug)?.quantity || 0) - (cart.find((entry) => entry.slug === item.slug)?.quantity || 0), 0);
  const limited = valid.filter((item) => (cart.find((entry) => entry.slug === item.slug)?.quantity || 0) + item.quantity > 20).map((item) => products.find((product) => product.slug === item.slug)?.name || item.slug);
  const message = added === 0 ? "No se añadió ninguna unidad." : added < requested ? `Se añadieron ${added} de ${requested} unidades al carrito.` : `Se ${added === 1 ? "añadió 1 unidad" : `añadieron ${added} unidades`} al carrito.`;
  return { cart: next, added, requested, limited, message: message + (limited.length ? ` Límite de 20 unidades por producto: ${limited.join(", ")}.` : "") };
}
export function restoreObjectiveDraft(raw, objectives, products) {
  const fallback = { selected: objectives[0].id, items: objectiveItems(objectives[0], products) };
  try {
    const draft = JSON.parse(raw);
    if (draft?.version !== 1 || !objectives.some((entry) => entry.id === draft.selected) || !Array.isArray(draft.items)) return fallback;
    return { selected: draft.selected, items: objectiveItems({ items: draft.items }, products) };
  } catch { return fallback; }
}
export function parseQuantity(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 20 ? quantity : null;
}
