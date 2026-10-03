// Fail fast at boot instead of on the first login when required configuration is missing.
const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const problems = [];

  for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[name] || process.env[name].length < 32) {
      problems.push(`${name} must be set (at least 32 characters)`);
    }
  }

  if (isProd) {
    if (!process.env.MONGO_URI) problems.push('MONGO_URI must be set in production');
    if (!process.env.FRONTEND_URL) problems.push('FRONTEND_URL must be set in production');
    if ((process.env.FRONTEND_URL || '').split(',').some((url) => url.trim() === '*')) {
      problems.push('FRONTEND_URL cannot be "*" because the API sends credentials');
    }
  }

  if (isProd && !(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    console.warn('[config] Cloudinary is not configured: uploaded images are saved on the server disk and are lost when the server is redeployed.');
  }
  if (isProd && !process.env.BACKEND_URL) {
    console.warn('[config] BACKEND_URL is not set: payment callbacks and upload links may point to the wrong address.');
  }

  if (isProd && String(process.env.DEMO_LOGIN_ENABLED).toLowerCase() === 'true' && String(process.env.DEMO_LOGIN_ROLES || 'customer,admin').includes('admin')) {
    console.warn('[config] DEMO_LOGIN_ENABLED is on with the admin role: anyone visiting the site can open the admin panel.');
  }

  if (problems.length) {
    throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }

  if (!process.env.NODE_ENV) {
    console.warn('[config] NODE_ENV is not set. Set NODE_ENV=production on your server so secure cookies are used.');
  }
};

module.exports = { validateEnv };
