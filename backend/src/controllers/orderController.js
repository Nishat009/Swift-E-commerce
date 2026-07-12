const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const { products, shippingAddress, paymentMethod, couponCode } = req.body;

  try {
    let subtotal = 0;
    const orderItems = [];

    // 1. Stock Validation and calculation
    for (const item of products) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return sendError(res, `Product not found with ID: ${item.product}`, 404);
      }

      if (dbProduct.stock < item.quantity) {
        return sendError(
          res,
          `Insufficient stock for product '${dbProduct.title}'. Available: ${dbProduct.stock}, Requested: ${item.quantity}`,
          400
        );
      }

      const finalPrice = dbProduct.price * (1 - (dbProduct.discountPercentage || 0) / 100);
      subtotal += finalPrice * item.quantity;

      orderItems.push({
        product: dbProduct._id,
        quantity: item.quantity,
        price: finalPrice
      });
    }

    // 2. Coupon Validation
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon) {
        const now = new Date();
        if (coupon.expiry > now) {
          if (coupon.percentage > 0) {
            couponDiscount = subtotal * (coupon.percentage / 100);
          } else if (coupon.amount > 0) {
            couponDiscount = coupon.amount;
          }
        }
      }
    }

    // 3. Tax and Shipping calculations
    // Apply coupon discount (min subtotal remains 0)
    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const tax = Number((discountedSubtotal * 0.1).toFixed(2)); // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100, else $10
    const total = Number((discountedSubtotal + tax + shipping).toFixed(2));

    // 4. Update inventories (decrement stocks)
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // 5. Generate Order Number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Create Order
    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      products: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      shipping,
      tax,
      coupon: couponCode || '',
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
    return sendSuccess(res, 'Order created successfully', order, 201);
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

    if (order.orderStatus === 'Cancelled') {
      return sendError(res, 'Order is already cancelled', 400);
    }

    // Restore stocks
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

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

    if (status) {
      order.orderStatus = status;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();
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
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 'All orders retrieved successfully', orders);
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
