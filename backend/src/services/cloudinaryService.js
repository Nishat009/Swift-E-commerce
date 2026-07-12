const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = async (file, folderName = 'swiftcart') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isCloudinaryConfigured = cloudName && cloudName !== 'your_cloud_name' && apiKey && apiSecret;

  if (!file) return null;

  try {
    if (isCloudinaryConfigured) {
      // Configure Cloudinary explicitly if not already
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folderName,
        resource_type: 'auto',
      });

      // Remove file from local server
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return result.secure_url;
    } else {
      // Local fallback url (e.g., /uploads/filename)
      // The caller will prepend the server host if needed
      const relativePath = `/uploads/${path.basename(file.path)}`;
      return relativePath;
    }
  } catch (error) {
    console.error('File Upload Error:', error);
    // Cleanup local file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error(`Upload service failed: ${error.message}`);
  }
};

module.exports = {
  uploadToCloudinary,
};
