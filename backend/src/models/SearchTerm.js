const mongoose = require('mongoose');

// Storefront search counts for the "trending searches" panel (FR-1.19)
const SearchTermSchema = new mongoose.Schema(
  {
    term: { type: String, required: true, unique: true, trim: true, lowercase: true },
    count: { type: Number, default: 0 },
    resultCount: { type: Number, default: 0 },
    lastSearchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SearchTermSchema.index({ lastSearchedAt: -1, count: -1 });

module.exports = mongoose.model('SearchTerm', SearchTermSchema);
