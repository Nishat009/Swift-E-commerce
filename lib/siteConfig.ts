// Single place for owner-specific shop details. Edit the defaults below or set
// the NEXT_PUBLIC_* variables in .env.local. Shown on About, Contact, Terms,
// Privacy and Shipping pages.
export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftCart',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@yourshop.com',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+880 1XXX-XXXXXX',
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'House 00, Road 00, Your Area, Dhaka, Bangladesh',
  hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS || 'Sat - Thu, 10:00 AM - 7:00 PM (BST)',
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/yourshop',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/yourshop',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || '',
  },
  freeShippingThreshold: 100,
  shippingFee: 10,
  taxRate: 0.1,
  lastUpdated: 'October 3, 2026',
};
