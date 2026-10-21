// Writes database/seed.sql: the demo categories and products as plain SQL (CREATE TABLE + INSERT),
// generated from the same data as seed:catalog so the two cannot drift apart.
// SwiftCart itself runs on MongoDB; this file is for reading the sample data or loading it into
// MySQL, PostgreSQL or SQLite.
//   npm --prefix backend run db:seed-sql
const fs = require('fs');
const path = require('path');

const fashionProductsData = require('./fashionProductsData');
const fashionCategories = require('./fashionCategories');
const { buildProduct } = require('./seedCatalog');

const OUT = path.join(__dirname, '../../database/seed.sql');

const sql = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};

const insert = (table, columns, rows) =>
  rows.map((row) => `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${row.map(sql).join(', ')});`).join('\n');

const PRODUCT_COLUMNS = [
  'sku', 'slug', 'title', 'short_description', 'description', 'category_slug', 'brand', 'price', 'sale_price',
  'original_price', 'discount_percentage', 'stock', 'rating', 'featured', 'new_arrival', 'best_seller',
  'thumbnail', 'images', 'tags', 'specifications',
];

const productRow = (p) => [
  p.SKU, p.slug, p.title, p.shortDescription, p.description, p.category, p.brand, p.price, p.salePrice,
  p.originalPrice, p.discountPercentage, p.stock, p.rating, Boolean(p.featured), Boolean(p.newArrival),
  Boolean(p.bestSeller), p.thumbnail, JSON.stringify(p.images), JSON.stringify(p.tags),
  JSON.stringify(Object.fromEntries(p.specifications)),
];

const buildSeedSql = () => {
  const taken = new Set();
  const products = fashionProductsData.map((product) => buildProduct(product, taken));

  return `-- SwiftCart demo data as plain SQL.
--
-- The app stores its data in MongoDB (see database/README.md), so nothing here is needed to run it.
-- This file holds the same demo categories and products that "npm --prefix backend run seed:catalog"
-- adds to MongoDB, so they can be read or loaded into MySQL, PostgreSQL or SQLite.
-- Prices are in USD. images, tags and specifications are JSON text.
--
-- GENERATED FILE: do not edit by hand. Rebuild with: npm --prefix backend run db:seed-sql
--
-- Demo accounts are not included because passwords are stored hashed. Create them with
-- "npm --prefix backend run seed:admin" (see HowToSetup.md).

CREATE TABLE IF NOT EXISTS categories (
  slug     VARCHAR(80)  PRIMARY KEY,
  name     VARCHAR(80)  NOT NULL UNIQUE,
  image    TEXT         NOT NULL,
  featured BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS products (
  sku                 VARCHAR(40)   PRIMARY KEY,
  slug                VARCHAR(160)  NOT NULL UNIQUE,
  title               VARCHAR(200)  NOT NULL,
  short_description   TEXT,
  description         TEXT          NOT NULL,
  category_slug       VARCHAR(80)   NOT NULL REFERENCES categories (slug),
  brand               VARCHAR(80)   NOT NULL,
  price               DECIMAL(10,2) NOT NULL,
  sale_price          DECIMAL(10,2),
  original_price      DECIMAL(10,2),
  discount_percentage INTEGER       NOT NULL DEFAULT 0,
  stock               INTEGER       NOT NULL DEFAULT 0,
  rating              DECIMAL(2,1)  NOT NULL DEFAULT 0,
  featured            BOOLEAN       NOT NULL DEFAULT FALSE,
  new_arrival         BOOLEAN       NOT NULL DEFAULT FALSE,
  best_seller         BOOLEAN       NOT NULL DEFAULT FALSE,
  thumbnail           TEXT          NOT NULL,
  images              TEXT,
  tags                TEXT,
  specifications      TEXT
);

-- Categories (${fashionCategories.length})
${insert('categories', ['slug', 'name', 'image', 'featured'], fashionCategories.map((c) => [c.slug, c.name, c.image, c.featured]))}

-- Products (${products.length}): ${products.filter((p) => p.newArrival).length} in "New in", ${products.filter((p) => p.bestSeller).length} in "Bestsellers"
${insert('products', PRODUCT_COLUMNS, products.map(productRow))}
`;
};

if (require.main === module) {
  fs.writeFileSync(OUT, buildSeedSql());
  console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
}

module.exports = { buildSeedSql, OUT };
