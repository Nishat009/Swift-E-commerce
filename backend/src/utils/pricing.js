// Server-side price calculation. The browser may send variant info, but the price
// is always recomputed here from the product document.

const discounted = (price, discountPercentage) =>
  price * (1 - (Number(discountPercentage) || 0) / 100);

// Client sends the selected options as `attributes` (group -> option object) or
// `options` (group -> option id / name / object). Normalise to [{ group, key }].
const selectedOptionKeys = (variant) => {
  if (!variant || typeof variant !== 'object') return [];
  const source = variant.attributes || variant.options;
  if (!source || typeof source !== 'object') return [];
  return Object.entries(source).map(([group, opt]) => ({
    group,
    key: opt && typeof opt === 'object' ? (opt.id || opt.value || opt.name) : opt
  })).filter((s) => s.key !== undefined && s.key !== null && s.key !== '');
};

const matchOption = (group, key) =>
  (group.options || []).find((o) =>
    [o.id, o.value, o.name].some((v) => v !== undefined && v !== null && String(v) === String(key))
  );

// Resolve a client variant against the product. Unknown options are ignored (never trusted).
const resolveVariant = (product, variant) => {
  const groups = product.variants || [];
  const resolved = {};
  let delta = 0;
  let optionStock = null;

  selectedOptionKeys(variant).forEach(({ group, key }) => {
    const g = groups.find((x) => x.name === group || x.id === group);
    const opt = g && matchOption(g, key);
    if (!opt) return;
    resolved[g.name] = opt.id || opt.value || opt.name;
    delta += Number(opt.priceDelta) || 0;
    if (typeof opt.stock === 'number') optionStock = optionStock === null ? opt.stock : Math.min(optionStock, opt.stock);
  });

  // A single option id/sku can also be sent (older clients): look it up across groups
  if (!Object.keys(resolved).length && variant && variant.id) {
    for (const g of groups) {
      const opt = (g.options || []).find((o) => o.id && String(o.id) === String(variant.id));
      if (opt) {
        resolved[g.name] = opt.id;
        delta += Number(opt.priceDelta) || 0;
        if (typeof opt.stock === 'number') optionStock = opt.stock;
        break;
      }
    }
  }

  // An explicit variant combination (own price) overrides base + deltas
  let combinationPrice = null;
  const combos = product.variantCombinations || [];
  if (variant && (variant.id || variant.sku) && combos.length) {
    const combo = combos.find((c) =>
      (variant.id && c.id && String(c.id) === String(variant.id)) ||
      (variant.sku && c.sku && String(c.sku) === String(variant.sku))
    );
    if (combo && combo.status !== 'inactive' && Number(combo.price) > 0) {
      combinationPrice = Number(combo.price);
      if (typeof combo.stock === 'number') optionStock = combo.stock;
    }
  }

  return { options: resolved, delta, combinationPrice, optionStock };
};

// Final unit price (after product-level discount) for a product + client variant.
const unitPrice = (product, variant) => {
  const r = resolveVariant(product, variant);
  const base = r.combinationPrice !== null ? r.combinationPrice : Number(product.price) + r.delta;
  return {
    price: Number(Math.max(0, discounted(base, product.discountPercentage)).toFixed(2)),
    options: r.options,
    optionStock: r.optionStock
  };
};

// Clean variant stored on cart / order lines (no client-supplied price).
const normalizeVariant = (product, variant) => {
  const r = resolveVariant(product, variant);
  return {
    id: (variant && variant.id) ? String(variant.id) : '',
    name: (variant && variant.name) ? String(variant.name) : '',
    sku: (variant && variant.sku) ? String(variant.sku) : '',
    options: r.options
  };
};

module.exports = { discounted, unitPrice, normalizeVariant };
