// Single place for owner-specific shop details. Set the NEXT_PUBLIC_* variables
// in .env.local. Shown on About, Contact, Terms, Privacy and Shipping pages.
// Contact details have no made-up defaults: anything left unset is simply not shown.
export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftCart',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '',
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || '',
  hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS || 'Sat - Thu, 10:00 AM - 7:00 PM (BST)',
  // Pre-selected country on address forms
  defaultCountry: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'Bangladesh',
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_URL || '',
  },
  freeShippingThreshold: 100,
  shippingFee: 10,
  taxRate: 0.1,
  lastUpdated: 'October 3, 2026',
};
