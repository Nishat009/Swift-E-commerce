const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  variant: {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    sku: { type: String, default: '' },
    options: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  // Variant options / combination whose own stock this line reserved (restored on cancel)
  stockTargets: { type: [mongoose.Schema.Types.Mixed], default: [] }
});

const OrderAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true, default: 0 },
    // Cash on delivery only: which delivery charge was applied ('' for card / bKash orders)
    deliveryZone: { type: String, enum: ['', 'inside_dhaka', 'outside_dhaka'], default: '' },
    tax: { type: Number, required: true, default: 0 },
    coupon: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    promoDiscount: { type: Number, default: 0 },
    couponReleased: { type: Boolean, default: false },
    total: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refund Needed', 'Refunded'], default: 'Pending' },
    paymentMethod: { type: String, required: true, default: 'card' },
    paymentGateway: { type: String, default: '' },
    paymentSessionId: { type: String, default: '', index: true },
    // Every gateway session started for this order, so a payment on an older tab still settles
    paymentSessionIds: { type: [String], default: [], index: true },
    paymentTransactionId: { type: String, default: '' },
    // Filled when an admin marks a cancelled / returned order's payment as refunded
    refund: {
      amount: { type: Number },
      at: { type: Date },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      byName: { type: String, default: '' },
      reference: { type: String, default: '' },
      note: { type: String, default: '' },
    },
    paidAt: { type: Date, default: null },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending'
    },
    // Starts the return window (set when the order is marked Delivered)
    deliveredAt: { type: Date, default: null },
    // The customer's return / refund request on a delivered order; staff approve or reject it
    returnRequest: {
      status: { type: String, enum: ['', 'Requested', 'Approved', 'Rejected'], default: '' },
      reason: { type: String, default: '' },
      details: { type: String, default: '' },
      requestedAt: { type: Date },
      decidedAt: { type: Date },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      decidedByName: { type: String, default: '' },
      // Staff reply shown to the customer (required when rejecting)
      response: { type: String, default: '' },
    },
    shippingAddress: { type: OrderAddressSchema, required: true }
  },
  { timestamps: true }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'returnRequest.status': 1 });

OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    if (Array.isArray(ret.products)) ret.products.forEach((p) => { delete p.stockTargets; });
    return ret;
  }
});

module.exports = mongoose.model('Order', OrderSchema);
