// Creates the SwiftCart database from scratch: every collection plus its indexes, built
// from the Mongoose models (the source of truth for the schema). Non-destructive: existing
// collections, documents and indexes are left alone.
//   node scripts/initDb.js          create collections + indexes
//   node scripts/initDb.js --dump   also write database/schema.json (no DB connection needed)
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const modelsDir = path.join(__dirname, '../src/models');
fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js')).forEach((f) => require(path.join(modelsDir, f)));

const describeSchema = (schema) => {
  const fields = {};
  schema.eachPath((name, type) => {
    if (name === '__v') return;
    const o = type.options || {};
    const field = { type: type.instance };
    if (type.instance === 'Array' && type.caster) field.of = type.caster.instance || 'Mixed';
    if (type.schema) field.fields = describeSchema(type.schema);
    if (o.ref || (type.caster && type.caster.options && type.caster.options.ref)) {
      field.ref = o.ref || type.caster.options.ref;
    }
    if (o.required) field.required = true;
    if (o.unique) field.unique = true;
    if (o.enum) field.enum = Array.isArray(o.enum) ? o.enum : o.enum.values;
    if (o.default !== undefined && typeof o.default !== 'function') field.default = o.default;
    fields[name] = field;
  });
  return fields;
};

const dumpSchema = () => {
  const out = {};
  for (const name of mongoose.modelNames().sort()) {
    const model = mongoose.model(name);
    out[name] = {
      collection: model.collection.collectionName,
      timestamps: Boolean(model.schema.options.timestamps),
      fields: describeSchema(model.schema),
      indexes: model.schema.indexes().map(([keys, options]) => ({ keys, ...options })),
    };
  }
  const target = path.join(__dirname, '../../database/schema.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), target)} (${Object.keys(out).length} collections).`);
};

const initDb = async () => {
  if (process.argv.includes('--dump')) dumpSchema();
  if (process.argv.includes('--dump-only')) return;

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.name}.`);
  for (const name of mongoose.modelNames().sort()) {
    const model = mongoose.model(name);
    await model.createCollection();
    await model.createIndexes();
    console.log(`  ${model.collection.collectionName}: ready`);
  }
  await mongoose.disconnect();
  console.log('Database initialised.');
};

initDb().catch((err) => {
  console.error(err);
  process.exit(1);
});
