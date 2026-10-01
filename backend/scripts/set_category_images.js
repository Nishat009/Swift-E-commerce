const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Category = require('../src/models/Category');

const dir = path.join(__dirname, '../../public/images/categories');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
  for (const c of await Category.find()) {
    const file = ['jpg', 'jpeg', 'png', 'webp'].map((e) => `${c.slug}.${e}`).find((f) => fs.existsSync(path.join(dir, f)));
    if (!file) continue;
    c.image = `/images/categories/${file}`;
    await c.save();
    console.log(`updated ${c.slug} -> ${c.image}`);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
