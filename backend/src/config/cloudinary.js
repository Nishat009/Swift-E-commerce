const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || cloudName === 'your_cloud_name' || !apiKey || !apiSecret) {
    console.warn('WARNING: Cloudinary credentials are missing or default. File uploads will fallback to the local filesystem.');
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('Cloudinary Configured successfully.');
  return true;
};

module.exports = {
  cloudinary,
  configureCloudinary,
};
