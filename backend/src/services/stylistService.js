const Product = require('../models/Product');

const advise = async (message) => {
  const query = message.toLowerCase();
  const budgetMatch = query.match(/(?:under|below|within|maximum|max)\s*[৳$]?\s*(\d{2,7})/i);
  const statedBudget = budgetMatch ? Number(budgetMatch[1]) : null;
  const inTaka = /(?:taka|bdt|৳)/i.test(query);
  const exchangeRate = Number(process.env.BDT_PER_USD) > 0 ? Number(process.env.BDT_PER_USD) : 120;
  const budget = statedBudget && inTaka ? statedBudget / exchangeRate : statedBudget;
  const categoryWords = ['shirt', 'top', 'pants', 'jeans', 'dress', 'jacket', 'shoes', 'bag', 'sweater'];
  const colorWords = ['black', 'white', 'blue', 'red', 'green', 'beige', 'brown', 'cream'];
  const category = categoryWords.find((word) => query.includes(word));
  const color = colorWords.find((word) => query.includes(word));
  const filter = { active: true, status: 'published', visibility: 'public', stock: { $gt: 0 } };
  if (budget) filter.price = { $lte: budget };
  if (category) filter.$or = [{ category: new RegExp(category, 'i') }, { title: new RegExp(category, 'i') }];
  if (color) filter.title = new RegExp(color, 'i');
  let products = await Product.find(filter).sort({ featured: -1, rating: -1 }).limit(4);
  const matchedRequest = products.length > 0;
  if (!products.length && (category || color || budget)) {
    products = await Product.find({ active: true, status: 'published', visibility: 'public', stock: { $gt: 0 } })
      .sort({ featured: -1, rating: -1 }).limit(4);
  }
  const text = products.length
    ? `${matchedRequest ? 'Here are' : 'I could not find an exact match. Here are'} ${products.length} available pieces from our current catalog${matchedRequest && statedBudget ? ` within your ${statedBudget}${inTaka ? ' taka' : ' dollar'} budget` : ''}. Select a product to check sizes, stock and details.`
    : 'There are no available products to recommend right now. Please check back after the catalog is updated.';
  return { text, products: products.map((product) => product.toJSON()) };
};

module.exports = { advise };
