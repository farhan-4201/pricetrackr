const mongoose = require("mongoose");

const SearchResultSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
    index: true
  },
  results: [{
    name: String,
    price: Number,
    url: String,
    imageUrl: String,
    marketplace: {
      type: String,
      enum: ['Daraz', 'Alibaba', 'Amazon', 'eBay'],
      required: true
    }
  }],
  searchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  resultCount: {
    type: Number,
    default: 0
  }
});

// Index for fast queries by query and date
SearchResultSchema.index({ query: 1, searchedAt: -1 });

// Index for expiration - delete old search results after 7 days
SearchResultSchema.index({ searchedAt: 1 }, {
  expireAfterSeconds: 7 * 24 * 60 * 60
});

module.exports = mongoose.model("SearchResult", SearchResultSchema);
