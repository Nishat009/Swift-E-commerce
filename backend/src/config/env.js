// Fail fast at boot instead of on the first login when required configuration is missing.
const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const problems = [];

  for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[name] || process.env[name].length < 32) {
      problems.push(`${name} must be set (at least 32 characters)`);
    }
  }

  for (const name of ['PAYMENT_SETTINGS_KEY', 'CHAT_HASH_KEY']) {
    if (process.env[name] && process.env[name].length < 32) {
      problems.push(`${name} must be at least 32 characters`);
    }
  }

  if (isProd) {
    if (!process.env.MONGO_URI) problems.push('MONGO_URI must be set in production');
    if (!process.env.FRONTEND_URL) problems.push('FRONTEND_URL must be set in production');
    if ((process.env.FRONTEND_URL || '').split(',').some((url) => url.trim() === '*')) {
      problems.push('FRONTEND_URL cannot be "*" because the API sends credentials');
    }
    // A shared password would let anyone sign in to the demo accounts with the normal form
    if (process.env.DEMO_PASSWORD) {
      problems.push('DEMO_PASSWORD must not be set in production (the shared demo password is for local and review setups only)');
    }
  }

  if (isProd && !(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    console.warn('[config] Cloudinary is not configured: uploaded images are saved on the server disk and are lost when the server is redeployed.');
  }
  if (isProd && !process.env.BACKEND_URL) {
    console.warn('[config] BACKEND_URL is not set: payment callbacks and upload links may point to the wrong address.');
  }

  if (isProd && !process.env.PAYMENT_SETTINGS_KEY) {
    console.warn('[config] PAYMENT_SETTINGS_KEY is not set: gateway keys cannot be saved from the admin panel (environment keys still work).');
  }

  if (isProd && String(process.env.DEMO_LOGIN_ENABLED).toLowerCase() === 'true') {
    console.warn('[config] DEMO_LOGIN_ENABLED is on in production: anyone visiting the site can sign in as the shared demo customer. The demo admin stays off in production.');
  }
  if (isProd && String(process.env.DEMO_ALLOW_ADMIN).toLowerCase() === 'true') {
    console.warn('[config] DEMO_ALLOW_ADMIN is ignored when NODE_ENV=production.');
  }

  if (problems.length) {
    throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }

  if (!process.env.NODE_ENV) {
    console.warn('[config] NODE_ENV is not set. Set NODE_ENV=production on your server so secure cookies are used.');
  }
};

module.exports = { validateEnv };
