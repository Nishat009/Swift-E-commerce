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
// Which field identifies an option in the database (used for atomic stock updates)
const optionIdentity = (opt) => {
  for (const field of ['id', 'value', 'name']) {
    if (opt[field] !== undefined && opt[field] !== null && opt[field] !== '') return { field, value: String(opt[field]) };
  }
  return null;
};

const resolveVariant = (product, variant) => {
  const groups = product.variants || [];
  const resolved = {};
  let delta = 0;
  let optionStock = null;
  // Options / combination that carry their own stock count, so orders can reserve them
  const stockTargets = [];
  const trackOption = (g, opt) => {
    if (typeof opt.stock !== 'number') return;
    const identity = optionIdentity(opt);
    if (identity) stockTargets.push({ kind: 'option', group: g.name, ...identity });
  };

  selectedOptionKeys(variant).forEach(({ group, key }) => {
    const g = groups.find((x) => x.name === group || x.id === group);
    const opt = g && matchOption(g, key);
    if (!opt) return;
    resolved[g.name] = opt.id || opt.value || opt.name;
    delta += Number(opt.priceDelta) || 0;
    if (typeof opt.stock === 'number') optionStock = optionStock === null ? opt.stock : Math.min(optionStock, opt.stock);
    trackOption(g, opt);
  });

  // A single option id/sku can also be sent (older clients): look it up across groups
  if (!Object.keys(resolved).length && variant && variant.id) {
    for (const g of groups) {
      const opt = (g.options || []).find((o) => o.id && String(o.id) === String(variant.id));
      if (opt) {
        resolved[g.name] = opt.id;
        delta += Number(opt.priceDelta) || 0;
        if (typeof opt.stock === 'number') optionStock = opt.stock;
        trackOption(g, opt);
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
      if (typeof combo.stock === 'number') {
        optionStock = combo.stock;
        if (combo.id) {
          // The combination's own stock replaces the per-option counts
          stockTargets.length = 0;
          stockTargets.push({ kind: 'combination', id: String(combo.id) });
        }
      }
    }
  }

  return { options: resolved, delta, combinationPrice, optionStock, stockTargets };
};

// Final unit price (after product-level discount) for a product + client variant.
const unitPrice = (product, variant) => {
  const r = resolveVariant(product, variant);
  const base = r.combinationPrice !== null ? r.combinationPrice : Number(product.price) + r.delta;
  return {
    price: Number(Math.max(0, discounted(base, product.discountPercentage)).toFixed(2)),
    options: r.options,
    optionStock: r.optionStock,
    stockTargets: r.stockTargets
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
