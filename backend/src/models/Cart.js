const mongoose = require('mongoose');

const variantFields = {
  id: { type: String, default: '' },
  name: { type: String, default: '' },
  sku: { type: String, default: '' },
  options: { type: mongoose.Schema.Types.Mixed, default: {} }
};

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  variant: variantFields
});

// "Save for later" lines live on the account, so they follow the shopper across devices
const SavedItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  variant: variantFields,
  savedAt: { type: Date, default: Date.now }
});

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [CartItemSchema],
    savedForLater: { type: [SavedItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

CartSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Cart', CartSchema);
