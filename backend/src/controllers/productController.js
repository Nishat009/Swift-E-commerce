const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const mongoose = require('mongoose');
const StockAlert = require('../models/StockAlert');
const { snapshotForAlerts, sendProductAlerts } = require('../services/productAlertService');
const searchService = require('../services/searchService');
const { pickProductFields, csvToProducts, prepareImported } = require('../services/productImport');

const { isAdmin } = require('../middleware/authMiddleware');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PUBLIC_FILTER = { active: true, status: 'published', visibility: 'public' };
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'price', 'title', 'rating', 'soldCount', 'stock'];
const MAX_PAGE_SIZE = 500;
const AUDITED_FIELDS = ['title', 'price', 'discountPercentage', 'stock', 'status', 'category', 'brand', 'visibility', 'active', 'featured'];
const auditFields = (product) => Object.fromEntries(AUDITED_FIELDS.map((k) => [k, product.get(k)]));

// @desc    Get all products with search, filter, pagination, sorting
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      skip,
      category,
      subcategory,
      search,
      priceMin,
      priceMax,
      brand,
      rating,
      availability,
      featured,
      trending,
      newArrival,
      bestSeller,
      status,
      visibility,
      stockStatus,
      newest,
      sort,
      order,
      sortBy,
      color,
      size,
      all
    } = req.query;

    // Only admins may see drafts, archived, hidden or inactive products
    const adminView = all === 'true' && isAdmin(req);
    const query = adminView ? {} : { ...PUBLIC_FILTER };

    if (adminView && status && status !== 'all') {
      query.status = status;
    }

    if (adminView && visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    // Category Filter
    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    // Subcategory Filter
    if (subcategory && subcategory !== 'all') {
      query.subcategory = subcategory.toLowerCase();
    }

    // Stock Status Filter
    if (stockStatus && stockStatus !== 'all') {
      query.stockStatus = stockStatus;
    }

    // Full-Text Search (Title, Brand, Category, SKU, Barcode, Tags, Description)
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { subcategory: searchRegex },
        { sku: searchRegex },
        { SKU: searchRegex },
        { barcode: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Price Filtering
    if ((priceMin !== undefined && priceMin !== '') || (priceMax !== undefined && priceMax !== '')) {
      query.price = {};
      if (priceMin !== undefined && priceMin !== '') query.price.$gte = Number(priceMin);
      if (priceMax !== undefined && priceMax !== '') query.price.$lte = Number(priceMax);
    }

    // Brand Filter
    if (brand) {
      const brands = String(brand).split(',').map(b => b.trim()).filter(Boolean);
      if (brands.length) query.brand = brands.length > 1 ? { $in: brands } : brands[0];
    }

    // Tag Filter (comma separated, matches any)
    if (req.query.tag) {
      const tagList = String(req.query.tag).split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length) query.tags = { $in: tagList };
    }

    // Rating Filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Color Filter
    if (color) {
      const colors = color.split(',').map(c => c.trim());
      query['specifications.ColorName'] = { $in: colors };
    }

    // Size Filter
    if (size) {
      const sizes = size.split(',').map(s => s.trim());
      const regexes = sizes.map(s => new RegExp(`\\b${escapeRegex(s)}\\b`, 'i'));
      query['specifications.Sizes'] = { $in: regexes };
    }

    // Availability Filter
    if (availability === 'in-stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'out-of-stock') {
      query.stock = 0;
    }

    // Flag Filters
    if (featured === 'true' || featured === true) query.featured = true;
    if (trending === 'true' || trending === true) query.trending = true;
    if (newArrival === 'true' || newArrival === true) query.newArrival = true;
    if (bestSeller === 'true' || bestSeller === true) query.bestSeller = true;

    // Sorting definition
    let sortOptions = {};

    if (newest === 'true') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy) {
      if (sortBy === 'price-asc') sortOptions = { price: 1 };
      else if (sortBy === 'price-desc') sortOptions = { price: -1 };
      else if (sortBy === 'rating') sortOptions = { rating: -1 };
      else if (sortBy === 'sold') sortOptions = { soldCount: -1 };
      else sortOptions = { createdAt: -1 };
    } else if (sort && SORTABLE_FIELDS.includes(sort)) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = Math.max(1, Math.floor(Number(page)) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(limit)) || 12));
    const skipNum = skip !== undefined ? Math.max(0, Math.floor(Number(skip)) || 0) : (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skipNum)
      .limit(limitNum);

    let didYouMean = null;
    if (search && !adminView) {
      searchService.recordSearch(search, total);
      if (total === 0) didYouMean = await searchService.didYouMean(search);
    }

    return res.status(200).json({
      success: true,
      code: 200,
      status: 200,
      products,
      data: products,
      total,
      skip: skipNum,
      limit: limitNum,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      didYouMean,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID, numeric ID, SKU, or slug
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  const { id } = req.params;
  try {
    let product;
    // Storefront visitors only see live products; admins can open drafts for editing
    const visible = isAdmin(req) ? {} : PUBLIC_FILTER;

    // 1. Try MongoDB ObjectId if valid 24-hex string
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: id, ...visible }).populate('relatedProducts').populate('bundles');
    }

    // 2. Try Slug, SKU, Barcode, or exact Title match
    if (!product) {
      product = await Product.findOne({
        ...visible,
        $or: [
          { slug: id },
          { sku: id },
          { SKU: id },
          { barcode: id },
          { title: new RegExp(`^${escapeRegex(id.replace(/-/g, ' '))}$`, 'i') }
        ]
      }).populate('relatedProducts').populate('bundles');
    }

    // 3. If ID is numeric (e.g. 104, 101), map to catalog title or index
    if (!product && /^\d+$/.test(id)) {
      const numId = parseInt(id, 10);
      const catalogTitleMap = {
        101: 'Cropped Ribbed Knit Tank',
        102: 'Cozy Cable Knit Sweater',
        103: 'High-Rise Denim Jeans',
        104: 'Tailored Linen Trouser',
        105: 'Floral Silk Slip Dress',
        106: 'Oversized Classic Trench Coat',
        107: 'Minimalist Leather Shoulder Bag',
        108: 'Gold Hoop Earrings & Necklace Set',
        201: 'Premium Heavyweight Cotton Tee',
        202: 'Relaxed Oxford Cotton Shirt',
        203: 'Streetwear Cargo Utility Pants',
        204: 'Classic Relaxed Chino',
        205: 'Eco-Leather Bomber Jacket',
        206: 'Retro Denim Trucker Jacket',
        207: 'Air Platform Sneakers',
        208: 'Classic Leather Chelsea Boots',
        301: 'Premium Wool Felt Fedora',
        302: 'Canvas Sport Baseball Cap',
        303: 'Retro Oval Acetate Sunglasses',
      };

      if (catalogTitleMap[numId]) {
        product = await Product.findOne({ ...visible, title: catalogTitleMap[numId] }).populate('relatedProducts').populate('bundles');
      }

      // Nth live product, fetched alone instead of loading the whole catalogue
      if (!product && numId < 10000) {
        product = await Product.findOne({ active: true, ...visible }).sort({ _id: 1 }).skip(numId);
      }
    }

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, 'Product retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const productData = pickProductFields(req.body);
    if (!productData.sku) {
      productData.sku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    }
    const product = await Product.create(productData);
    searchService.resetVocabulary();
    await logAudit(req, 'Product', product._id, `Created product "${product.title}"`, {}, auditFields(product));
    await logActivity(req, 'Product Created', `Created product "${product.title}" (${product.sku})`);
    return sendSuccess(res, 'Product created successfully', product, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Use set + save so schema hooks (stockStatus, SKU sync, discounts) run on update
    const payload = pickProductFields(req.body);
    const tracked = AUDITED_FIELDS;
    const before = {};
    tracked.forEach((k) => { before[k] = product.get(k); });
    const alertSnapshot = snapshotForAlerts(product);
    product.set(payload);
    const updatedProduct = await product.save();
    searchService.resetVocabulary();
    // Wishlist customers get a price-drop / restock notification
    await sendProductAlerts(alertSnapshot, updatedProduct);
    const prevState = {};
    const nextState = {};
    tracked.forEach((k) => {
      const now = updatedProduct.get(k);
      if (String(before[k]) !== String(now)) { prevState[k] = before[k]; nextState[k] = now; }
    });
    if (Object.keys(nextState).length) {
      await logAudit(req, 'Product', updatedProduct._id, `Updated ${Object.keys(nextState).join(', ')}`, prevState, nextState);
    }
    await logActivity(req, 'Product Updated', `Updated product "${updatedProduct.title}"`);

    return sendSuccess(res, 'Product updated successfully', updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate a product
// @route   POST /api/products/:id/duplicate
// @access  Private/Admin
const duplicateProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const sourceProduct = await Product.findById(id).lean();
    if (!sourceProduct) {
      return sendError(res, 'Source product not found', 404);
    }

    delete sourceProduct._id;
    delete sourceProduct.id;
    delete sourceProduct.createdAt;
    delete sourceProduct.updatedAt;

    sourceProduct.title = `${sourceProduct.title} (Copy)`;
    sourceProduct.slug = `${sourceProduct.slug || 'product'}-copy-${Date.now()}`;
    sourceProduct.sku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    sourceProduct.status = 'draft';
    delete sourceProduct.SKU;

    // A copy starts without the original's reviews and sales
    const duplicated = await Product.create(pickProductFields(sourceProduct));
    await logAudit(req, 'Product', duplicated._id, `Duplicated from "${sourceProduct.title.replace(/ \(Copy\)$/, '')}"`, {}, auditFields(duplicated));
    await logActivity(req, 'Product Duplicated', `Duplicated "${duplicated.title}"`);
    return sendSuccess(res, 'Product duplicated successfully', duplicated, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk action on products (delete, publish, archive)
// @route   POST /api/products/bulk
// @access  Private/Admin
const bulkActionProducts = async (req, res, next) => {
  const { productIds, action } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return sendError(res, 'No product IDs provided', 400);
  }
  if (productIds.length > 500 || !productIds.every((id) => mongoose.isValidObjectId(String(id)))) {
    return sendError(res, 'Provide up to 500 valid product IDs', 400);
  }
  const changes = {
    delete: { update: { active: false, status: 'archived' }, label: 'Product Bulk Archive', done: 'deleted', log: 'Removed %n products from the store' },
    publish: { update: { status: 'published', active: true }, label: 'Product Bulk Publish', done: 'published', log: 'Published %n products' },
    archive: { update: { status: 'archived' }, label: 'Product Bulk Archive', done: 'archived', log: 'Archived %n products' },
  }[action];
  if (!changes) {
    return sendError(res, 'Invalid bulk action specified', 400);
  }

  try {
    const before = await Product.find({ _id: { $in: productIds } }).select('title status active');
    await Product.updateMany({ _id: { $in: productIds } }, changes.update);
    for (const product of before) {
      await logAudit(req, 'Product', product._id, `Bulk ${action}: "${product.title}"`,
        { status: product.status, active: product.active }, changes.update);
    }
    searchService.resetVocabulary();
    await logActivity(req, changes.label, changes.log.replace('%n', before.length));
    return sendSuccess(res, `Bulk ${changes.done} ${before.length} products successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const prev = { status: product.status, active: product.active };
    product.active = false;
    product.status = 'archived';
    await product.save();
    searchService.resetVocabulary();
    await logAudit(req, 'Product', product._id, `Removed "${product.title}" from the store`, prev, { status: 'archived', active: false });
    await logActivity(req, 'Product Removed', `Removed "${product.title}" from the store (archived)`);

    return sendSuccess(res, 'Product deleted (deactivated) successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Import products from a JSON array or CSV text (created as drafts unless a status is given)
// @route   POST /api/products/import   body: { products: [...] } or { csv: "title,price,..." }
// @access  Private/Admin
const importProducts = async (req, res, next) => {
  try {
    let rows;
    if (Array.isArray(req.body.products)) rows = req.body.products;
    else if (typeof req.body.csv === 'string') rows = csvToProducts(req.body.csv);
    else return sendError(res, 'Send a "products" array or "csv" text', 400);
    if (!rows.length) return sendError(res, 'No products found to import', 400);
    if (rows.length > 1000) return sendError(res, 'Import at most 1000 products at a time', 400);

    const created = [];
    const failed = [];
    for (const [index, raw] of rows.entries()) {
      try {
        const product = await Product.create(prepareImported(raw));
        created.push(product);
      } catch (err) {
        const message = err.name === 'ValidationError'
          ? Object.values(err.errors).map((e) => e.message).join(', ')
          : err.code === 11000 ? `Duplicate ${Object.keys(err.keyValue || {})[0] || 'value'}` : err.message;
        failed.push({ row: index + 1, title: String(raw?.title || raw?.name || 'Untitled'), message });
      }
    }
    if (created.length) {
      searchService.resetVocabulary();
      await logActivity(req, 'Product Import', `Imported ${created.length} products (${failed.length} failed)`);
    }
    return sendSuccess(res, `Imported ${created.length} of ${rows.length} products`, { created: created.length, failed }, created.length ? 201 : 200);
  } catch (error) {
    next(error);
  }
};

// @desc    Autocomplete + "did you mean" for the search box
// @route   GET /api/products/search/suggest?q=
// @access  Public
const searchSuggestions = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').slice(0, 100);
    const suggestions = await searchService.suggest(q);
    const didYouMean = suggestions.length ? null : await searchService.didYouMean(q);
    return sendSuccess(res, 'Search suggestions', { suggestions, didYouMean });
  } catch (error) {
    next(error);
  }
};

// @desc    Most searched terms
// @route   GET /api/products/search/trending
// @access  Public
const trendingSearches = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Trending searches', await searchService.trending());
  } catch (error) {
    next(error);
  }
};

// @desc    Email me when this product is back in stock (FR-1.15)
// @route   POST /api/products/:id/notify-me   body: { email } (optional when signed in)
// @access  Public
const subscribeBackInStock = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Product not found', 404);
    const product = await Product.findOne({ _id: req.params.id, ...PUBLIC_FILTER });
    if (!product) return sendError(res, 'Product not found', 404);
    if (product.stock > 0) return sendError(res, 'This product is in stock right now.', 400);

    const email = String(req.body.email || req.user?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return sendError(res, 'Please enter a valid email address.', 422);
    }
    await StockAlert.updateOne(
      { product: product._id, email, pending: true },
      { $setOnInsert: { user: req.user?._id || null } },
      { upsert: true }
    ).catch((err) => { if (err.code !== 11000) throw err; });
    return sendSuccess(res, "We'll email you as soon as it's back in stock.", { productId: product.id, email }, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importProducts,
  searchSuggestions,
  trendingSearches,
  subscribeBackInStock,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  duplicateProduct,
  bulkActionProducts,
  deleteProduct,
};
