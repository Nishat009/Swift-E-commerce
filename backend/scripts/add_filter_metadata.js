require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
    console.log(`MongoDB Connected for migration: ${conn.connection.host}`);
    await runMigration();
  } catch (error) {
    console.error(`Migration DB Error: ${error.message}`);
    process.exit(1);
  }
};

const mapHexToColorName = (hex, title) => {
  const t = title.toLowerCase();
  if (t.includes('blue') || t.includes('denim') || t.includes('twilight')) return 'Blue';
  if (t.includes('beige') || t.includes('cream') || t.includes('crop') || t.includes('sand')) return 'Beige';
  if (t.includes('grey') || t.includes('gray') || t.includes('cable knit')) return 'Grey';
  if (t.includes('pink') || t.includes('rose') || t.includes('floral')) return 'Pink';
  if (t.includes('black') || t.includes('charcoal') || t.includes('dark')) return 'Black';
  if (t.includes('brown') || t.includes('tan') || t.includes('wood') || t.includes('trench') || t.includes('oak')) return 'Brown';
  if (t.includes('white') || t.includes('ivory') || t.includes('light')) return 'White';
  if (t.includes('green') || t.includes('olive') || t.includes('emerald')) return 'Green';

  if (!hex) return 'Black';
  const h = hex.toLowerCase();
  if (['#e3dac9', '#dfdcd6', '#f5f0e6', '#e3ded5', '#dfdcd6'].includes(h)) return 'Beige';
  if (['#4a6b82', '#5888a5', '#4a6b82'].includes(h)) return 'Blue';
  if (['#8a7d72', '#9c8e82', '#c8b195', '#d0bc9c', '#c8b195'].includes(h)) return 'Brown';
  if (['#e2b3c2', '#cca3b0'].includes(h)) return 'Pink';
  if (['#ffffff', '#fff', '#f3f4f6'].includes(h)) return 'White';
  if (['#000000', '#111111', '#181715'].includes(h)) return 'Black';
  
  return 'Black'; // Fallback default
};

const runMigration = async () => {
  try {
    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate.`);

    let updatedCount = 0;
    for (let product of products) {
      const category = product.category.toLowerCase();
      const title = product.title;
      
      // Get existing specs
      const specs = product.specifications ? Object.fromEntries(product.specifications) : {};
      
      // 1. Determine ColorName
      const hexColor = specs.Color || specs.SvgColor;
      const colorName = mapHexToColorName(hexColor, title);
      specs.ColorName = colorName;

      // 2. Determine Sizes
      if (['top', 'pants', 'dress', 'jacket', 'shoes'].includes(category)) {
        specs.Sizes = 'S, M, L, XL';
      } else if (['sofa', 'chair', 'table'].includes(category)) {
        specs.Sizes = 'Standard';
      } else {
        specs.Sizes = 'One Size';
      }

      // Update product Mongoose Map
      product.specifications = specs;
      product.markModified('specifications');
      await product.save();
      updatedCount++;
    }

    console.log(`Migration complete! Successfully updated ${updatedCount} products.`);
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(`Migration execution error: ${err.message}`);
    process.exit(1);
  }
};

connectDB();
