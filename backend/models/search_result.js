import mongoose from "mongoose";

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
      enum: ['Daraz', 'PriceOye', 'Amazon', 'eBay', 'Alibaba', 'Telemart'],
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

// Compound index for fast queries by query and date
SearchResultSchema.index({ query: 1, searchedAt: -1 });

// Index for marketplace queries
SearchResultSchema.index({ "results.marketplace": 1 });

// Index for result count queries
SearchResultSchema.index({ resultCount: -1 });

// Compound index for pagination and filtering
SearchResultSchema.index({ query: 1, resultCount: -1, searchedAt: -1 });

// TTL index for automatic deletion of old search results after 7 days
SearchResultSchema.index({ searchedAt: 1 }, {
  expireAfterSeconds: 7 * 24 * 60 * 60
});

// Create text index for product name searches within results
SearchResultSchema.index({ "results.name": "text" }, {
  name: "search_text_index",
  background: true
});

const SearchResult = mongoose.model("SearchResult", SearchResultSchema);

export default SearchResult;
