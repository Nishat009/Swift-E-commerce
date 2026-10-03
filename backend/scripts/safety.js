// Seed/demo scripts wipe collections and reset passwords. They only run against a local
// database unless the caller passes --force, and never when NODE_ENV=production.
const assertSafeToSeed = (scriptName) => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
  const isLocal = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(uri);
  const forced = process.argv.includes('--force');

  if (process.env.NODE_ENV === 'production') {
    console.error(`[${scriptName}] Refusing to run with NODE_ENV=production.`);
    process.exit(1);
  }
  if (!isLocal && !forced) {
    console.error(`[${scriptName}] MONGO_URI points to a remote database. This script deletes or overwrites data.`);
    console.error(`[${scriptName}] Re-run with --force if you really mean it.`);
    process.exit(1);
  }
  return uri;
};

module.exports = { assertSafeToSeed };
