const mongoose = require('mongoose');

const AuditTrailSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, enum: ['Campaign', 'Product', 'Order'] },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeSummary: { type: String, required: true },
    previousState: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed },
    newState: { type: mongoose.Schema.Types.Map, of: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

AuditTrailSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete _id;
    delete __v;
    return ret;
  }
});

module.exports = mongoose.model('AuditTrail', AuditTrailSchema);
