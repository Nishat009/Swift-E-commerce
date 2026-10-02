const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const { snapshotForAlerts, sendProductAlerts } = require('../services/productAlertService');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    const query = {};
    if (all !== 'true') {
      // Public storefront: only live, published, publicly visible products
      query.active = true;
      query.status = 'published';
      query.visibility = 'public';
    }

    // Status Filter (for admin table vs public view)
    if (all === 'true' && status && status !== 'all') {
      query.status = status;
    }

    // Visibility Filter
    if (visibility && visibility !== 'all') {
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
    } else if (sort) {
      const sortOrder = order === 'desc' ? -1 : 1;
      sortOptions[sort] = sortOrder;
    } else {
      sortOptions = { createdAt: -1 };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skipNum = skip !== undefined ? Number(skip) : (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skipNum)
      .limit(limitNum);

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

    // 1. Try MongoDB ObjectId if valid 24-hex string
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('relatedProducts').populate('bundles');
    }

    // 2. Try Slug, SKU, Barcode, or exact Title match
    if (!product) {
      product = await Product.findOne({
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
        product = await Product.findOne({ title: catalogTitleMap[numId] }).populate('relatedProducts').populate('bundles');
      }

      if (!product) {
        const all = await Product.find({ active: true });
        if (numId >= 0 && numId < all.length) {
          product = all[numId];
        }
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
    const productData = req.body;
    if (!productData.sku) {
      productData.sku = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    }
    const product = await Product.create(productData);
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
    const payload = { ...req.body };
    delete payload._id;
    delete payload.id;
    delete payload.createdAt;
    delete payload.updatedAt;
    const tracked = ['title', 'price', 'stock', 'status', 'category', 'brand', 'visibility', 'active', 'featured'];
    const before = {};
    tracked.forEach((k) => { before[k] = product.get(k); });
    const alertSnapshot = snapshotForAlerts(product);
    product.set(payload);
    const updatedProduct = await product.save();
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

    const duplicated = await Product.create(sourceProduct);
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

  try {
    if (action === 'delete') {
      await Product.updateMany({ _id: { $in: productIds } }, { active: false, status: 'archived' });
      await logActivity(req, 'Product Bulk Archive', `Removed ${productIds.length} products from the store`);
      return sendSuccess(res, `Bulk deleted ${productIds.length} products successfully`);
    } else if (action === 'publish') {
      await Product.updateMany({ _id: { $in: productIds } }, { status: 'published', active: true });
      await logActivity(req, 'Product Bulk Publish', `Published ${productIds.length} products`);
      return sendSuccess(res, `Bulk published ${productIds.length} products successfully`);
    } else if (action === 'archive') {
      await Product.updateMany({ _id: { $in: productIds } }, { status: 'archived' });
      await logActivity(req, 'Product Bulk Archive', `Archived ${productIds.length} products`);
      return sendSuccess(res, `Bulk archived ${productIds.length} products successfully`);
    } else {
      return sendError(res, 'Invalid bulk action specified', 400);
    }
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

    product.active = false;
    product.status = 'archived';
    await product.save();
    await logActivity(req, 'Product Removed', `Removed "${product.title}" from the store (archived)`);

    return sendSuccess(res, 'Product deleted (deactivated) successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  duplicateProduct,
  bulkActionProducts,
  deleteProduct,
};
