// Admin writing help: a product copy draft (title, descriptions, tags, SEO text) built from a few
// attributes with a fixed template. No external AI service is called.
const { sendSuccess } = require('../utils/response');

// @desc    Editable title, descriptions, tags and SEO text built from a few product attributes
// @route   POST /api/admin/copy-draft
// @access  Private/Admin (input checked by copyDraftRules)
const generateCopyDraft = (req, res) => {
  const { category, material, color, brand } = req.body;
  const title = `${color} ${material} ${category} by ${brand}`;
  const keywords = [category, material, color, brand].map((value) => value.toLowerCase());
  return sendSuccess(res, 'Copy draft created', {
    title,
    shortDescription: `${brand} ${category} in ${color}, made with ${material}. Review fit and care details before publishing.`,
    seoDescription: `Explore the ${title}. See product details, available sizes and delivery information at SwiftCart.`,
    highlights: [`Material: ${material}`, `Color: ${color}`, `Category: ${category}`],
    tags: keywords,
    metaKeywords: keywords,
  });
};

module.exports = { generateCopyDraft };
