const crypto = require('crypto');
const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');

const LIVE = { active: true, status: 'published', visibility: 'public' };
const MAX_COLLECTIONS = 20;

// Accepts a Mongo id, slug or SKU (older catalog links use slugs)
const findProduct = async (productId, filter = {}) => {
  const id = String(productId || '');
  if (!id) return null;
  if (mongoose.isValidObjectId(id)) {
    const byId = await Product.findOne({ _id: id, ...filter });
    if (byId) return byId;
  }
  return Product.findOne({ ...filter, $or: [{ slug: id }, { sku: id }] });
};

const loadWishlist = async (userId) => {
  const existing = await Wishlist.findOne({ user: userId });
  if (existing) return existing;
  return Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { products: [], collections: [], alerts: [] } },
    { upsert: true, new: true }
  );
};

const liveProducts = (products) => (products || []).filter((p) => p && p.active !== false && p.status === 'published' && p.visibility === 'public');

const sharePath = (token) => (token ? `/wishlist/shared/${token}` : null);

// Full wishlist view: products, collections, alert settings and share link
const detailsOf = async (wishlist) => {
  await wishlist.populate('products');
  const products = (wishlist.products || []).filter(Boolean);
  const alertFor = (id) => {
    const pref = (wishlist.alerts || []).find((a) => String(a.product) === String(id));
    return { priceDrop: pref ? pref.priceDrop : true, backInStock: pref ? pref.backInStock : true };
  };
  return {
    products,
    collections: (wishlist.collections || []).map((c) => ({
      id: c.id,
      name: c.name,
      productIds: c.products.map(String).filter((id) => products.some((p) => String(p._id) === id)),
    })),
    alerts: Object.fromEntries(products.map((p) => [String(p._id), alertFor(p._id)])),
    share: { enabled: Boolean(wishlist.shareToken), path: sharePath(wishlist.shareToken) },
  };
};

// @desc    Get user wishlist (product list, kept for existing clients)
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await loadWishlist(req.user.id);
    await wishlist.populate('products');
    return sendSuccess(res, 'Wishlist retrieved successfully', (wishlist.products || []).filter(Boolean));
  } catch (error) {
    next(error);
  }
};

// @desc    Wishlist with collections, alert toggles and share status (FR-1.18)
// @route   GET /api/wishlist/details
// @access  Private
const getWishlistDetails = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Wishlist retrieved successfully', await detailsOf(await loadWishlist(req.user.id)));
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist (optionally straight into a collection)
// @route   POST /api/wishlist   body: { productId, collectionId? }
// @access  Private
const addToWishlist = async (req, res, next) => {
  const { productId, collectionId } = req.body;
  if (!productId) {
    return sendError(res, 'Product ID is required', 400);
  }

  try {
    const product = await findProduct(productId, LIVE);
    if (!product) {
      return sendError(res, 'Product not found in store database', 404);
    }

    const filter = { user: req.user.id };
    const update = { $addToSet: { products: product._id } };
    if (collectionId) {
      if (!mongoose.isValidObjectId(String(collectionId))) return sendError(res, 'Collection not found', 404);
      filter['collections._id'] = collectionId;
      update.$addToSet['collections.$.products'] = product._id;
    }
    await loadWishlist(req.user.id);
    const before = await Wishlist.findOneAndUpdate(filter, update);
    if (!before) return sendError(res, 'Collection not found', 404);
    const wasSaved = before.products.some((id) => id.equals(product._id));
    if (!collectionId && wasSaved) {
      return sendError(res, 'Product already in wishlist', 409);
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    if (!wasSaved) await Product.updateOne({ _id: product._id }, { $inc: { wishlistCount: 1 } });
    return sendSuccess(res, 'Product added to wishlist successfully', wishlist.products.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist (and from every collection)
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    // Resolve slug / SKU the same way add does, but also find unpublished products
    const product = await findProduct(req.params.productId);
    const targetId = product ? product._id : (mongoose.isValidObjectId(req.params.productId) ? new mongoose.Types.ObjectId(req.params.productId) : null);
    if (!targetId) return sendError(res, 'Product not found', 404);

    const before = await Wishlist.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { products: targetId, 'collections.$[].products': targetId, alerts: { product: targetId } } }
    );
    if (!before) return sendError(res, 'Wishlist not found', 404);
    if (before.products.some((id) => id.equals(targetId))) {
      await Product.updateOne({ _id: targetId, wishlistCount: { $gt: 0 } }, { $inc: { wishlistCount: -1 } });
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    return sendSuccess(res, 'Product removed from wishlist successfully', wishlist.products.filter(Boolean));
  } catch (error) {
    next(error);
  }
};

const cleanName = (name) => (typeof name === 'string' ? name.trim().slice(0, 60) : '');

// @desc    Create a collection
// @route   POST /api/wishlist/collections   body: { name }
// @access  Private
const createCollection = async (req, res, next) => {
  try {
    const name = cleanName(req.body.name);
    if (!name) return sendError(res, 'Collection name is required', 422);
    const wishlist = await loadWishlist(req.user.id);
    if (wishlist.collections.length >= MAX_COLLECTIONS) return sendError(res, `You can have up to ${MAX_COLLECTIONS} collections`, 400);
    if (wishlist.collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return sendError(res, 'You already have a collection with that name', 409);
    }
    wishlist.collections.push({ name, products: [] });
    await wishlist.save();
    return sendSuccess(res, 'Collection created', await detailsOf(wishlist), 201);
  } catch (error) {
    next(error);
  }
};

const findCollection = (wishlist, collectionId) =>
  (mongoose.isValidObjectId(String(collectionId)) ? wishlist.collections.id(collectionId) : null);

// @desc    Rename a collection
// @route   PUT /api/wishlist/collections/:collectionId   body: { name }
// @access  Private
const renameCollection = async (req, res, next) => {
  try {
    const name = cleanName(req.body.name);
    if (!name) return sendError(res, 'Collection name is required', 422);
    const wishlist = await loadWishlist(req.user.id);
    const collection = findCollection(wishlist, req.params.collectionId);
    if (!collection) return sendError(res, 'Collection not found', 404);
    if (wishlist.collections.some((c) => c.id !== collection.id && c.name.toLowerCase() === name.toLowerCase())) {
      return sendError(res, 'You already have a collection with that name', 409);
    }
    collection.name = name;
    await wishlist.save();
    return sendSuccess(res, 'Collection renamed', await detailsOf(wishlist));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a collection (its products stay in the wishlist)
// @route   DELETE /api/wishlist/collections/:collectionId
// @access  Private
const deleteCollection = async (req, res, next) => {
  try {
    const wishlist = await loadWishlist(req.user.id);
    const collection = findCollection(wishlist, req.params.collectionId);
    if (!collection) return sendError(res, 'Collection not found', 404);
    collection.deleteOne();
    await wishlist.save();
    return sendSuccess(res, 'Collection deleted', await detailsOf(wishlist));
  } catch (error) {
    next(error);
  }
};

// @desc    Put a saved product into a collection or take it out
// @route   PUT /api/wishlist/collections/:collectionId/products   body: { productId, action: 'add' | 'remove' }
// @access  Private
const moveInCollection = async (req, res, next) => {
  try {
    const { productId, action } = req.body;
    if (!['add', 'remove'].includes(action)) return sendError(res, 'action must be "add" or "remove"', 422);
    const wishlist = await loadWishlist(req.user.id);
    const collection = findCollection(wishlist, req.params.collectionId);
    if (!collection) return sendError(res, 'Collection not found', 404);
    const saved = wishlist.products.find((id) => String(id) === String(productId));
    if (!saved) return sendError(res, 'Save the product to your wishlist first', 404);

    if (action === 'add') collection.products.addToSet(saved);
    else collection.products.pull(saved);
    await wishlist.save();
    return sendSuccess(res, action === 'add' ? 'Added to collection' : 'Removed from collection', await detailsOf(wishlist));
  } catch (error) {
    next(error);
  }
};

// @desc    Turn price-drop / back-in-stock alerts on or off for one saved product
// @route   PUT /api/wishlist/alerts/:productId   body: { priceDrop?, backInStock? }
// @access  Private
const updateAlerts = async (req, res, next) => {
  try {
    const { priceDrop, backInStock } = req.body;
    if ((priceDrop !== undefined && typeof priceDrop !== 'boolean') || (backInStock !== undefined && typeof backInStock !== 'boolean')) {
      return sendError(res, 'priceDrop and backInStock must be true or false', 422);
    }
    const wishlist = await loadWishlist(req.user.id);
    const saved = wishlist.products.find((id) => String(id) === String(req.params.productId));
    if (!saved) return sendError(res, 'This product is not in your wishlist', 404);

    let pref = wishlist.alerts.find((a) => String(a.product) === String(saved));
    if (!pref) {
      wishlist.alerts.push({ product: saved });
      pref = wishlist.alerts[wishlist.alerts.length - 1];
    }
    if (priceDrop !== undefined) pref.priceDrop = priceDrop;
    if (backInStock !== undefined) pref.backInStock = backInStock;
    await wishlist.save();
    return sendSuccess(res, 'Alert settings saved', await detailsOf(wishlist));
  } catch (error) {
    next(error);
  }
};

// @desc    Turn the public share link on (new link each time) or off
// @route   POST /api/wishlist/share   body: { enabled: boolean }
// @access  Private
const setSharing = async (req, res, next) => {
  try {
    const wishlist = await loadWishlist(req.user.id);
    wishlist.shareToken = req.body.enabled === false ? undefined : crypto.randomBytes(16).toString('hex');
    await wishlist.save();
    return sendSuccess(res, wishlist.shareToken ? 'Share link created' : 'Sharing turned off', {
      enabled: Boolean(wishlist.shareToken),
      path: sharePath(wishlist.shareToken),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Read-only view of a shared wishlist
// @route   GET /api/wishlist/shared/:token
// @access  Public
const getSharedWishlist = async (req, res, next) => {
  try {
    const token = String(req.params.token || '');
    if (!/^[0-9a-f]{32}$/.test(token)) return sendError(res, 'This wishlist link is not valid', 404);
    const wishlist = await Wishlist.findOne({ shareToken: token }).populate('products').populate('user', 'name');
    if (!wishlist) return sendError(res, 'This wishlist link is not valid', 404);
    const products = liveProducts(wishlist.products);
    const ownerFirstName = String(wishlist.user?.name || 'A shopper').split(' ')[0];
    return sendSuccess(res, 'Shared wishlist', {
      owner: ownerFirstName,
      products,
      collections: wishlist.collections.map((c) => ({
        name: c.name,
        productIds: c.products.map(String).filter((id) => products.some((p) => String(p._id) === id)),
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  getWishlistDetails,
  addToWishlist,
  removeFromWishlist,
  createCollection,
  renameCollection,
  deleteCollection,
  moveInCollection,
  updateAlerts,
  setSharing,
  getSharedWishlist,
};
