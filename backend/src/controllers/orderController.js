const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { unitPrice, normalizeVariant } = require('../utils/pricing');
const { CouponError, evaluateCoupon, redeemCoupon, releaseCouponUse } = require('../services/couponService');
const Cart = require('../models/Cart');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity, logAudit } = require('../utils/activityLog');
const Notification = require('../models/Notification');
const payments = require('../services/paymentService');
const { emailOrderEvent, fire: fireEmail } = require('../services/emailService');

// Best-effort in-app notification for the order owner (never blocks the order flow)
const notifyOrderUser = async (userId, title, message) => {
  try {
    await Notification.create({ user: userId, title, message, type: 'system' });
  } catch (err) {
    console.error('Order notification failed:', err.message);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const { products, shippingAddress, paymentMethod, couponCode } = req.body;

  try {
    if (!['cod', 'bkash', 'card'].includes(paymentMethod) || !payments.isMethodEnabled(paymentMethod)) {
      return sendError(res, 'Selected payment method is not available', 400);
    }

    let subtotal = 0;
    const orderItems = [];

    // 1. Stock Validation and calculation
    for (const item of products) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct || dbProduct.active === false || dbProduct.status === 'archived') {
        return sendError(res, `Product is no longer available (ID: ${item.product})`, 404);
      }

      if (dbProduct.stock < item.quantity) {
        return sendError(
          res,
          `Insufficient stock for product '${dbProduct.title}'. Available: ${dbProduct.stock}, Requested: ${item.quantity}`,
          400
        );
      }

      // Price (base + selected variant, minus discount) is computed here, never taken from the client
      const clientVariant = item.variant || item.selectedVariant || {};
      const { price: finalPrice } = unitPrice(dbProduct, clientVariant);
      subtotal += finalPrice * item.quantity;

      orderItems.push({
        product: dbProduct._id,
        quantity: item.quantity,
        price: finalPrice,
        variant: normalizeVariant(dbProduct, clientVariant)
      });
    }
    subtotal = Number(subtotal.toFixed(2));

    // 2. Coupon validation (min spend, usage limits) - an invalid code rejects the order
    let couponDiscount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      try {
        const result = await evaluateCoupon(couponCode, req.user.id, subtotal);
        appliedCoupon = result.coupon;
        couponDiscount = result.discount;
      } catch (err) {
        if (err instanceof CouponError) return sendError(res, err.message, err.status);
        throw err;
      }
    }

    // 3. Tax and Shipping calculations
    // Apply coupon discount (min subtotal remains 0)
    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const tax = Number((discountedSubtotal * 0.1).toFixed(2)); // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100, else $10
    const total = Number((discountedSubtotal + tax + shipping).toFixed(2));

    // 4. Update inventories atomically with rollback protection
    const decrementedProducts = [];
    for (const item of orderItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        for (const rolled of decrementedProducts) {
          await Product.findByIdAndUpdate(rolled.id, { $inc: { stock: rolled.quantity } });
        }
        return sendError(
          res,
          `Stock changed or insufficient for a product in your order. Please review your cart.`,
          400
        );
      }
      decrementedProducts.push({ id: item.product, quantity: item.quantity });
    }

    // Take one coupon use atomically (another order may have used the last one meanwhile)
    if (appliedCoupon && !(await redeemCoupon(appliedCoupon))) {
      for (const rolled of decrementedProducts) {
        await Product.findByIdAndUpdate(rolled.id, { $inc: { stock: rolled.quantity } });
      }
      return sendError(res, 'This coupon has reached its usage limit', 400);
    }

    try {
      // 5. Generate Order Number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 6. Create Order
      const order = await Order.create({
        orderNumber,
        user: req.user.id,
        products: orderItems,
        subtotal,
        shipping,
        tax,
        coupon: appliedCoupon ? appliedCoupon.code : '',
        discount: couponDiscount,
        total,
        paymentMethod,
        paymentStatus: 'Pending', // Default
        orderStatus: 'Pending',
        shippingAddress
      });

      // 7. Clear user's Cart
      const cart = await Cart.findOne({ user: req.user.id });
      if (cart) {
        cart.products = [];
        cart.subtotal = 0;
        await cart.save();
      }

      await order.populate('products.product');
      await notifyOrderUser(
        req.user.id,
        'Order placed',
        `Your order ${order.orderNumber} was placed successfully. Total: $${order.total.toFixed(2)}.`
      );
      fireEmail(emailOrderEvent(order, 'confirmation'));
      return sendSuccess(res, 'Order created successfully', order, 201);
    } catch (orderErr) {
      // Rollback inventories and the coupon use if order creation failed
      if (appliedCoupon) await releaseCouponUse(appliedCoupon.code);
      for (const rolled of decrementedProducts) {
        await Product.findByIdAndUpdate(rolled.id, { $inc: { stock: rolled.quantity } });
      }
      throw orderErr;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 'Orders retrieved successfully', orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id).populate('products.product').populate('user', 'name email');
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Check ownership or admin role
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this order', 403);
    }

    return sendSuccess(res, 'Order retrieved successfully', order);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    // Check authorization
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to cancel this order', 403);
    }

    if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
      return sendError(res, 'Shipped or Delivered orders cannot be cancelled', 400);
    }

    if (order.orderStatus === 'Cancelled' || order.orderStatus === 'Returned') {
      return sendError(res, order.orderStatus === 'Cancelled' ? 'Order is already cancelled' : 'Returned orders cannot be cancelled', 400);
    }

    // Restore stocks
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.orderStatus = 'Cancelled';
    if (order.coupon && !order.couponReleased) {
      await releaseCouponUse(order.coupon);
      order.couponReleased = true;
    }
    await order.save();

    await notifyOrderUser(order.user, 'Order cancelled', `Your order ${order.orderNumber} has been cancelled.`);
    fireEmail(emailOrderEvent(order, 'status'));
    return sendSuccess(res, 'Order cancelled successfully', order);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    const validStatuses = Order.schema.path('orderStatus').enumValues;
    const validPayments = Order.schema.path('paymentStatus').enumValues;
    if (status && !validStatuses.includes(status)) {
      return sendError(res, `Invalid order status. Allowed: ${validStatuses.join(', ')}`, 400);
    }
    if (paymentStatus && !validPayments.includes(paymentStatus)) {
      return sendError(res, `Invalid payment status. Allowed: ${validPayments.join(', ')}`, 400);
    }

    const prevOrderState = { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus };
    if (status && status !== order.orderStatus) {
      // Cancelled / Returned orders give their stock back; reopening one takes it again
      const releasing = ['Cancelled', 'Returned'];
      const wasReleased = releasing.includes(order.orderStatus);
      const willRelease = releasing.includes(status);
      if (!wasReleased && willRelease) {
        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      } else if (wasReleased && !willRelease) {
        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }
      }
      // The coupon use follows the order: freed on cancel/return, taken again on reopen
      if (order.coupon) {
        if (!wasReleased && willRelease && !order.couponReleased) {
          await releaseCouponUse(order.coupon);
          order.couponReleased = true;
        } else if (wasReleased && !willRelease && order.couponReleased) {
          await Coupon.updateOne({ code: order.coupon }, { $inc: { usedCount: 1 } });
          order.couponReleased = false;
        }
      }
      order.orderStatus = status;
      if (status === 'Delivered' && order.paymentMethod === 'cod' && !paymentStatus) {
        order.paymentStatus = 'Paid';
      }
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    await logAudit(req, 'Order', order._id, `Order ${order.orderNumber} updated`, prevOrderState, { orderStatus: order.orderStatus, paymentStatus: order.paymentStatus });
    await logActivity(req, 'Order Updated', `Order ${order.orderNumber}: ${prevOrderState.orderStatus} -> ${order.orderStatus}, payment ${prevOrderState.paymentStatus} -> ${order.paymentStatus}`);
    if (order.orderStatus !== prevOrderState.orderStatus) {
      await notifyOrderUser(
        order.user,
        'Order update',
        `Your order ${order.orderNumber} is now: ${order.orderStatus}.`
      );
    }
    if (order.orderStatus !== prevOrderState.orderStatus) fireEmail(emailOrderEvent(order, 'status'));
    return sendSuccess(res, 'Order status updated successfully', order);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    return sendSuccess(res, 'All orders retrieved successfully', orders, 200, {
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
};
