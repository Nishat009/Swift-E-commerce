require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Coupon = require('../src/models/Coupon');
const Review = require('../src/models/Review');

const categoriesData = [
  { name: 'Top', slug: 'top', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=400&fit=crop', featured: true },
  { name: 'Pants', slug: 'pants', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop', featured: true },
  { name: 'Dress', slug: 'dress', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop', featured: true },
  { name: 'Jacket', slug: 'jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', featured: true },
  { name: 'Shoes', slug: 'shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', featured: true },
  { name: 'Hat', slug: 'hat', image: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&h=400&fit=crop', featured: false },
  { name: 'Bag', slug: 'bag', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', featured: false },
  { name: 'Jewelry', slug: 'jewelry', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop', featured: false },
  { name: 'Glasses', slug: 'glasses', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop', featured: false },
  { name: 'Sofa', slug: 'sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop', featured: true },
  { name: 'Chair', slug: 'chair', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop', featured: true },
  { name: 'Table', slug: 'table', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&h=400&fit=crop', featured: true },
  { name: 'Lighting', slug: 'lighting', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop', featured: false },
  { name: 'Decor', slug: 'decor', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop', featured: true },
  { name: 'Kitchen', slug: 'kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop', featured: false },
  { name: 'Bathroom', slug: 'bathroom', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop', featured: false },
  { name: 'Outdoor', slug: 'outdoor', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=400&fit=crop', featured: true }
];

// ─── Curated Product Catalog (50 products, unique names & images) ────────────
const curatedProducts = [
  // --- FASHION PRODUCTS ---
  {
    title: 'Cropped Ribbed Knit Tank',
    description: 'A premium cropped tank top knitted in soft, ribbed organic cotton. Features a sleek scoop neck and flatlock seams for ultimate comfort. Designed to flatter and fit close to the body, perfect for layering or wearing standalone during warm weather.',
    shortDescription: 'Premium cropped tank in ribbed organic cotton.',
    category: 'top', brand: 'ZaraStyle', price: 39, salePrice: 35,
    stock: 45, rating: 4.7, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=800&fit=crop'
    ],
    tags: ['minimalist', 'summer', 'casual'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e3dac9',
      'Material': '95% Organic Cotton, 5% Elastane',
      'Fabric': 'Ribbed stretch knit, lightweight & breathable',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'minimalist, summer, casual',
      'SvgStyle': 'tank',
      'SvgColor': '#f5f0e6',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Cozy Cable Knit Sweater',
    description: 'An oversized, warm cable-knit sweater made from premium wool blend. Exquisitely detailed stitching patterns offer a classic heritage look while the modern slouchy silhouette ensures casual ease. Perfect for cold autumn and winter layering.',
    shortDescription: 'Oversized warm wool blend cable-knit sweater.',
    category: 'top', brand: 'H&MClassic', price: 89, salePrice: 80,
    stock: 25, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=800&h=800&fit=crop'
    ],
    tags: ['cozy', 'winter', 'casual'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#8a7d72',
      'Material': '60% Merino Wool, 40% Recycled Nylon',
      'Fabric': 'Heavyweight cable weave, extremely soft and warm',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'cozy, winter, casual',
      'SvgStyle': 'sweater',
      'SvgColor': '#9c8e82',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'High-Rise Denim Jeans',
    description: 'Classic straight-leg denim jeans in a vintage wash. Crafted from heavyweight rigid cotton denim that softens beautifully over time. High-rise fit hugs your waist while maintaining a relaxed straight fit through the legs.',
    shortDescription: 'Classic straight-leg vintage denim jeans.',
    category: 'pants', brand: 'ZaraStyle', price: 79, salePrice: 69,
    stock: 35, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop'
    ],
    tags: ['streetwear', 'denim', 'vintage'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#4a6b82',
      'Material': '100% Rigid Organic Cotton',
      'Fabric': '13.5 oz heavy denim, classic twilight wash',
      'Delivery': '2-4 Business Days',
      'Occasion': 'casual, office',
      'StyleTags': 'streetwear, denim, vintage',
      'SvgStyle': 'jeans',
      'SvgColor': '#5888a5',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Tailored Linen Trouser',
    description: 'Lightweight and airy wide-leg trousers tailored in pure flax linen. Featuring a high-rise waist with crisp double pleats, belt loops, and hidden front closure. Offers effortless elegance for warm-weather office chic or weekend resort wear.',
    shortDescription: 'High-rise wide-leg pure linen trousers.',
    category: 'pants', brand: 'ZaraStyle', price: 95,
    stock: 18, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=800&fit=crop'
    ],
    tags: ['resort', 'smart-casual', 'office'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#dfdcd6',
      'Material': '100% European Flax Linen',
      'Fabric': 'Lightweight plain weave, breathable & pre-washed',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual, seasonal',
      'StyleTags': 'resort, smart-casual, office',
      'SvgStyle': 'pants',
      'SvgColor': '#e3ded5',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Floral Silk Slip Dress',
    description: 'An elegant midi slip dress cut on the bias from luxurious mulberry silk. Adorned with a delicate watercolor floral print. Features skinny adjustable shoulder straps and a graceful cowl neck. Fits beautifully to outline the silhouette.',
    shortDescription: 'Luxurious midi mulberry silk slip dress.',
    category: 'dress', brand: 'ZaraStyle', price: 180, salePrice: 153,
    stock: 12, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=800&fit=crop'
    ],
    tags: ['luxury', 'wedding-guest', 'summer-party'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#e2b3c2',
      'Material': '100% Mulberry Silk',
      'Fabric': 'Ultra-soft, satin-faced silk charmeuse',
      'Delivery': '1-2 Business Days',
      'Occasion': 'party, wedding, seasonal',
      'StyleTags': 'luxury, wedding-guest, summer-party',
      'SvgStyle': 'dress',
      'SvgColor': '#cca3b0',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Oversized Classic Trench Coat',
    description: 'A timeless double-breasted trench coat tailored in durable cotton gabardine. Features adjustable shoulder epaulets, belted cuffs, a removable storm flap, and matching waist belt. Provides water resistance and effortless Parisian elegance.',
    shortDescription: 'Classic double-breasted cotton gabardine trench.',
    category: 'jacket', brand: 'H&MClassic', price: 220, salePrice: 202,
    stock: 15, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop'
    ],
    tags: ['classic', 'autumn', 'layering'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#c8b195',
      'Material': '100% Water-Resistant Cotton Gabardine',
      'Fabric': 'Densely woven weather-resistant gabardine',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual, seasonal',
      'StyleTags': 'classic, autumn, layering',
      'SvgStyle': 'trench',
      'SvgColor': '#d0bc9c',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Minimalist Leather Shoulder Bag',
    description: 'A structural shoulder bag crafted in smooth, full-grain Italian leather. Features a curved silhouette, thin adjustable strap, zip closure, and interior patch pockets. Finished with minimal silver-tone hardware for a refined aesthetic.',
    shortDescription: 'Full-grain Italian leather shoulder bag.',
    category: 'bag', brand: 'ZaraStyle', price: 150,
    stock: 20, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop'
    ],
    tags: ['accessory', 'luxury', 'sleek'],
    specifications: {
      'Layer': 'bag',
      'Gender': 'female',
      'Color': '#1c1c1c',
      'Material': '100% Italian Nappa Leather, Cotton Lining',
      'Fabric': 'Smooth leather finish with custom grain detailing',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, office, party',
      'StyleTags': 'accessory, luxury, sleek',
      'SvgStyle': 'bag',
      'SvgColor': '#2b2b2b',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Gold Hoop Earrings & Necklace Set',
    description: 'A curated jewelry set featuring a 14k gold-plated choker chain and matching chunky round hoop earrings. Hypoallergenic, lightweight, and perfect for adding polished elegance to any basic top or cocktail dress.',
    shortDescription: '14k gold-plated brass hoops and choker set.',
    category: 'jewelry', brand: 'ZaraStyle', price: 45, salePrice: 40,
    stock: 50, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop'
    ],
    tags: ['accessory', 'gold', 'chic'],
    specifications: {
      'Layer': 'jewelry',
      'Gender': 'female',
      'Color': '#ffd700',
      'Material': '14k Gold-Plated Recycled Brass',
      'Fabric': 'Polished high-shine gold plating',
      'Delivery': '2-3 Business Days',
      'Occasion': 'party, office, wedding',
      'StyleTags': 'accessory, gold, chic',
      'SvgStyle': 'necklace',
      'SvgColor': '#ffd700',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Premium Heavyweight Cotton Tee',
    description: 'A structured crewneck t-shirt knitted from robust, 280gsm long-staple combed cotton. Offers an elegant dry-loop texture and a boxy, modern fit that retains its shape even after multiple washes. The ultimate wardrobe staple.',
    shortDescription: '280gsm heavyweight crewneck boxy tee.',
    category: 'top', brand: 'H&MClassic', price: 35,
    stock: 60, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&h=800&fit=crop'
    ],
    tags: ['minimalist', 'streetwear', 'everyday'],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#ffffff',
      'Material': '100% Combed Organic Cotton',
      'Fabric': '280gsm heavyweight jersey knit, pre-shrunk',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'minimalist, streetwear, everyday',
      'SvgStyle': 'tshirt',
      'SvgColor': '#fcfcfc',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Relaxed Oxford Cotton Shirt',
    description: 'A classic button-down shirt constructed from premium long-fiber Oxford cotton fabric. Featuring a relaxed modern drape, chest pocket, curved hem, and mother-of-pearl buttons. Pre-washed for a soft texture and immediate comfort.',
    shortDescription: 'Classic button-down pre-washed Oxford shirt.',
    category: 'top', brand: 'H&MClassic', price: 65, salePrice: 60,
    stock: 40, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop'
    ],
    tags: ['smart-casual', 'preppy', 'office'],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#a0c4de',
      'Material': '100% Long-Fiber Cotton',
      'Fabric': 'Medium weight Oxford weave, breathable & soft',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual',
      'StyleTags': 'smart-casual, preppy, office',
      'SvgStyle': 'shirt',
      'SvgColor': '#cbdceb',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Streetwear Cargo Utility Pants',
    description: 'Rugged cargo pants crafted in heavy cotton ripstop fabric. Designed with an elastic waistband, internal drawstrings, articulated knees, and multiple utility flap pockets. Perfect for a functional, utilitarian street aesthetic.',
    shortDescription: 'Rugged ripstop utility cargo trousers.',
    category: 'pants', brand: 'NikeSports', price: 85, salePrice: 72,
    stock: 30, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop'
    ],
    tags: ['streetwear', 'utility', 'outdoor'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'male',
      'Color': '#3d4b3c',
      'Material': '98% Cotton Ripstop, 2% Elastane',
      'Fabric': 'Woven ripstop cotton, abrasion-resistant',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'streetwear, utility, outdoor',
      'SvgStyle': 'cargo',
      'SvgColor': '#586b57',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Classic Relaxed Chino',
    description: 'A versatile flat-front chino trouser made from exceptionally soft cotton-twill stretch fabric. Features double-welt back pockets, side slant pockets, and a clean tapered hem. Ideal for effortless transitions from desk to dinner.',
    shortDescription: 'Stretch cotton-twill flat-front chino trousers.',
    category: 'pants', brand: 'H&MClassic', price: 69,
    stock: 45, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&h=800&fit=crop'
    ],
    tags: ['smart-casual', 'office', 'preppy'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'male',
      'Color': '#c2b29a',
      'Material': '97% Cotton Twill, 3% Lycra',
      'Fabric': 'Mid-weight stretch twill fabric',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual',
      'StyleTags': 'smart-casual, office, preppy',
      'SvgStyle': 'chinos',
      'SvgColor': '#d8ccb9',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Eco-Leather Bomber Jacket',
    description: 'A sleek bomber jacket crafted in premium vegan eco-leather. Features a rib-knit collar, hem, and cuffs, soft satin lining, silver zip closure, and angled snap pockets. Delivers a classic masculine edge with a modern eco-conscious design.',
    shortDescription: 'Premium vegan eco-leather classic bomber jacket.',
    category: 'jacket', brand: 'ZaraStyle', price: 140, salePrice: 126,
    stock: 22, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop'
    ],
    tags: ['edgy', 'winter', 'streetwear'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#1a1a1a',
      'Material': '100% Water-Resistant Polyurethane',
      'Fabric': 'Soft grain vegan leather, matte finish',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, party',
      'StyleTags': 'edgy, winter, streetwear',
      'SvgStyle': 'bomber',
      'SvgColor': '#2d2d2d',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Retro Denim Trucker Jacket',
    description: 'An iconic classic trucker jacket built in heavy raw-indigo denim. Featuring double chest flap pockets, waist tabs, and copper buttons. Boxy retro cut, perfect for double-denim looks or layering over white t-shirts.',
    shortDescription: 'Heavy 14oz raw-indigo classic trucker jacket.',
    category: 'jacket', brand: 'ZaraStyle', price: 110, salePrice: 104,
    stock: 20, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=800&h=800&fit=crop'
    ],
    tags: ['classic', 'vintage', 'layering'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#3b5266',
      'Material': '100% Heavyweight Cotton Denim',
      'Fabric': '14 oz raw denim, structured copper hardware',
      'Delivery': '2-4 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'classic, vintage, layering',
      'SvgStyle': 'denimJacket',
      'SvgColor': '#4d6980',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Air Platform Sneakers',
    description: 'Sporty retro sneakers designed with a layered leather and mesh upper, supported by a chunky cushioned air platform sole. Combines heritage Nike running aesthetics with absolute daily comfort.',
    shortDescription: 'Retro running platform sneakers with cushioned soles.',
    category: 'shoes', brand: 'NikeSports', price: 120,
    stock: 50, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'
    ],
    tags: ['athletic', 'streetwear', 'comfort'],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'unisex',
      'Color': '#f34c23',
      'Material': '40% Premium Leather, 30% Mesh, Rubber Outsole',
      'Fabric': 'Breathable athletic composite upper',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'athletic, streetwear, comfort',
      'SvgStyle': 'sneakers',
      'SvgColor': '#e5e5e5',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Classic Leather Chelsea Boots',
    description: 'A refined pair of pull-on Chelsea boots built in hand-finished full-grain leather. Designed with a flexible elastic side gusset, pull tabs, and robust Goodyear welted soles. Offers sophisticated masculine flair for formal or smart casual settings.',
    shortDescription: 'Goodyear-welted full-grain leather Chelsea boots.',
    category: 'shoes', brand: 'H&MClassic', price: 160, salePrice: 144,
    stock: 15, rating: 4.8, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&h=800&fit=crop'
    ],
    tags: ['smart', 'classic', 'formal'],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'male',
      'Color': '#5c4033',
      'Material': '100% Full-Grain Calfskin Leather',
      'Fabric': 'Waxed burnished finish, leather lining',
      'Delivery': '3-5 Business Days',
      'Occasion': 'office, casual, wedding',
      'StyleTags': 'smart, classic, formal',
      'SvgStyle': 'boots',
      'SvgColor': '#4d3326',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Premium Wool Felt Fedora',
    description: 'A sophisticated structured fedora hat crafted from premium Australian wool felt. Detailed with a tonal grosgrain ribbon trim and internal sweatband. Offers vintage styling options for any seasonal look.',
    shortDescription: 'Structured fedora hat in premium Australian wool felt.',
    category: 'hat', brand: 'ZaraStyle', price: 75,
    stock: 12, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=800&fit=crop'
    ],
    tags: ['accessory', 'classic', 'wool'],
    specifications: {
      'Layer': 'hat',
      'Gender': 'unisex',
      'Color': '#2b2b2b',
      'Material': '100% Australian Wool Felt',
      'Fabric': 'Structured felted wool, sweat-resistant',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'accessory, classic, wool',
      'SvgStyle': 'fedora',
      'SvgColor': '#424242',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Canvas Sport Baseball Cap',
    description: 'A casual six-panel baseball cap stitched in durable washed cotton canvas. Completed with an adjustable metal buckle tab, ventilation eyelets, and pre-curved brim. Ideal for athletic workouts or relaxed street styles.',
    shortDescription: 'Six-panel washed cotton canvas baseball cap.',
    category: 'hat', brand: 'NikeSports', price: 25,
    stock: 80, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop'
    ],
    tags: ['accessory', 'athletic', 'everyday'],
    specifications: {
      'Layer': 'hat',
      'Gender': 'unisex',
      'Color': '#3b4252',
      'Material': '100% Washed Cotton Canvas',
      'Fabric': 'Soft unstructured canvas twill',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'accessory, athletic, everyday',
      'SvgStyle': 'cap',
      'SvgColor': '#4c566a',
      'Assembly Required': 'No'
    }
  },
  {
    title: 'Retro Oval Acetate Sunglasses',
    description: 'Chic, vintage-inspired oval sunglasses sculpted in glossy organic acetate frames with dark 100% UV protective lenses. Elegant gold metal branding studs on the temples. Perfect retro styling for beach or city outings.',
    shortDescription: 'Retro oval sunglasses with 100% UV protection lenses.',
    category: 'glasses', brand: 'ZaraStyle', price: 49, salePrice: 44,
    stock: 40, rating: 4.8, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop'
    ],
    tags: ['accessory', 'retro', 'beach'],
    specifications: {
      'Layer': 'glasses',
      'Gender': 'unisex',
      'Color': '#111111',
      'Material': '100% Biodegradable Acetate Frames',
      'Fabric': 'Scratch-resistant CR-39 polar lenses',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'accessory, retro, beach',
      'SvgStyle': 'sunglasses',
      'SvgColor': '#2b2b2b',
      'Assembly Required': 'No'
    }
  },
  // ── SOFA (7 products) ──
  {
    title: 'Modern Leather Sofa',
    description: 'Premium full-grain leather sofa with sleek metal legs. Seats 3 comfortably with deep cushions and lumbar support. A statement piece for contemporary living rooms.',
    shortDescription: 'Premium leather sofa with metal legs for modern interiors.',
    category: 'sofa', brand: 'FurniturePro', price: 1299, salePrice: 1169,
    stock: 15, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&crop=top',
    ],
    tags: ['sofa', 'leather', 'modern', 'living-room'],
  },
  {
    title: 'Velvet Sectional Sofa',
    description: 'Plush velvet L-shaped sectional that transforms any living space. Features reversible chaise and high-density foam cushions for maximum comfort.',
    shortDescription: 'L-shaped velvet sectional with reversible chaise.',
    category: 'sofa', brand: 'FurniturePro', price: 1899, salePrice: 1519,
    stock: 8, rating: 4.7, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&h=600&fit=crop&crop=center',
    ],
    tags: ['sofa', 'velvet', 'sectional', 'living-room'],
  },
  {
    title: 'Scandinavian Fabric Loveseat',
    description: 'Compact two-seater loveseat inspired by Scandinavian design. Linen-blend fabric in warm neutral tones with tapered wooden legs.',
    shortDescription: 'Nordic-inspired two-seater loveseat in linen fabric.',
    category: 'sofa', brand: 'WoodCraft', price: 799, salePrice: 679,
    stock: 22, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800&h=800&fit=crop',
    ],
    tags: ['sofa', 'scandinavian', 'fabric', 'compact'],
  },
  {
    title: 'Chesterfield Tufted Sofa',
    description: 'Classic Chesterfield design with deep button tufting and rolled arms. Upholstered in rich faux leather, perfect for traditional and transitional spaces.',
    shortDescription: 'Classic button-tufted Chesterfield in faux leather.',
    category: 'sofa', brand: 'FurniturePro', price: 1499, salePrice: undefined,
    stock: 10, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=800&h=800&fit=crop',
    ],
    tags: ['sofa', 'chesterfield', 'tufted', 'classic'],
  },
  {
    title: 'Minimalist Linen Couch',
    description: 'Clean-lined linen couch with removable slipcovers. Easy to maintain and perfect for casual, airy interiors. Available in natural white and soft grey.',
    shortDescription: 'Minimal linen couch with removable washable covers.',
    category: 'sofa', brand: 'WoodCraft', price: 899,
    stock: 18, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=800&fit=crop',
    ],
    tags: ['sofa', 'linen', 'minimalist', 'washable'],
  },
  {
    title: 'Mid-Century Teak Sofa',
    description: 'Retro-inspired sofa with solid teak frame and woven fabric seat. Brings warm, mid-century modern charm to any living room or den.',
    shortDescription: 'Retro teak-frame sofa with woven fabric upholstery.',
    category: 'sofa', brand: 'WoodCraft', price: 1149,
    stock: 12, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=800&fit=crop',
    ],
    tags: ['sofa', 'mid-century', 'teak', 'retro'],
  },

  // ── CHAIR (7 products) ──
  {
    title: 'Ergonomic Office Chair',
    description: 'Full mesh ergonomic chair with adjustable lumbar support, headrest, and 4D armrests. Designed for all-day comfort during long work sessions.',
    shortDescription: 'Adjustable mesh office chair with lumbar support.',
    category: 'chair', brand: 'ComfortSeating', price: 549, salePrice: 439,
    stock: 30, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop',
    ],
    tags: ['chair', 'ergonomic', 'office', 'mesh'],
  },
  {
    title: 'Rattan Accent Chair',
    description: 'Hand-woven natural rattan accent chair with comfortable linen cushion. Brings bohemian warmth and texture to bedrooms, sunrooms, or reading nooks.',
    shortDescription: 'Natural rattan accent chair with linen cushion.',
    category: 'chair', brand: 'ArtisanCraft', price: 399,
    stock: 20, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop',
    ],
    tags: ['chair', 'rattan', 'bohemian', 'accent'],
  },
  {
    title: 'Oak Dining Chair Set',
    description: 'Set of 4 solid white oak dining chairs with curved backrest and contoured seat. Crafted for comfort and built to last generations.',
    shortDescription: 'Set of 4 solid oak dining chairs with curved backrest.',
    category: 'chair', brand: 'WoodCraft', price: 599, salePrice: 527,
    stock: 25, rating: 4.7, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&h=800&fit=crop',
    ],
    tags: ['chair', 'dining', 'oak', 'set'],
  },
  {
    title: 'Wingback Reading Chair',
    description: 'Classic wingback armchair upholstered in soft herringbone fabric. Deep seat and high back provide cozy support for hours of reading.',
    shortDescription: 'Classic herringbone wingback for cozy reading.',
    category: 'chair', brand: 'ComfortSeating', price: 649,
    stock: 14, rating: 4.8, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=800&h=800&fit=crop',
    ],
    tags: ['chair', 'wingback', 'reading', 'classic'],
  },
  {
    title: 'Swivel Lounge Chair',
    description: 'Contemporary swivel chair with 360° rotation. Plush bouclé upholstery sits atop a brushed steel pedestal base for effortless style.',
    shortDescription: '360° swivel lounge chair in soft bouclé fabric.',
    category: 'chair', brand: 'FurniturePro', price: 749, salePrice: 599,
    stock: 16, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&h=800&fit=crop',
    ],
    tags: ['chair', 'swivel', 'lounge', 'modern'],
  },
  {
    title: 'Leather Bar Stool',
    description: 'Counter-height bar stool with genuine leather seat and powder-coated iron frame. Includes built-in footrest for comfortable seating.',
    shortDescription: 'Leather bar stool with iron frame and footrest.',
    category: 'chair', brand: 'FurniturePro', price: 249,
    stock: 35, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=800&fit=crop',
    ],
    tags: ['chair', 'bar-stool', 'leather', 'counter'],
  },

  // ── TABLE (6 products) ──
  {
    title: 'Marble Coffee Table',
    description: 'Elegant Carrara marble top on a brushed gold metal frame. The centerpiece your living room deserves — timeless beauty meets structural integrity.',
    shortDescription: 'Carrara marble top table with brushed gold frame.',
    category: 'table', brand: 'MarbleHome', price: 449, salePrice: 413,
    stock: 25, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&h=800&fit=crop',
    ],
    tags: ['table', 'marble', 'coffee', 'gold'],
  },
  {
    title: 'Solid Oak Dining Table',
    description: 'Farmhouse-style dining table crafted from kiln-dried solid oak. Seats 6–8 guests comfortably. Natural grain variations make each table unique.',
    shortDescription: 'Farmhouse oak dining table seating 6–8 guests.',
    category: 'table', brand: 'WoodCraft', price: 999, salePrice: 849,
    stock: 10, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800&h=800&fit=crop',
    ],
    tags: ['table', 'dining', 'oak', 'farmhouse'],
  },
  {
    title: 'Glass Console Table',
    description: 'Tempered glass console table with chrome hairpin legs. Slim profile fits perfectly in entryways, hallways, and behind sofas.',
    shortDescription: 'Slim tempered glass console with chrome legs.',
    category: 'table', brand: 'MarbleHome', price: 349,
    stock: 20, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&h=800&fit=crop',
    ],
    tags: ['table', 'glass', 'console', 'chrome'],
  },
  {
    title: 'Walnut Writing Desk',
    description: 'Mid-century walnut writing desk with two soft-close drawers and cable management. Compact footprint ideal for home offices and studios.',
    shortDescription: 'Mid-century walnut desk with drawers and cable management.',
    category: 'table', brand: 'WoodCraft', price: 599,
    stock: 18, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=800&fit=crop',
    ],
    tags: ['table', 'desk', 'walnut', 'office'],
  },
  {
    title: 'Round Pedestal Table',
    description: 'Classic round pedestal dining table with a smooth lacquer finish. Seats 4 comfortably. Ideal for breakfast nooks and smaller dining areas.',
    shortDescription: 'Classic lacquered round table seating 4.',
    category: 'table', brand: 'FurniturePro', price: 499, salePrice: 449,
    stock: 15, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
    ],
    tags: ['table', 'round', 'pedestal', 'dining'],
  },
  {
    title: 'Industrial Pipe Side Table',
    description: 'Reclaimed wood top mounted on industrial iron pipe legs. A rustic accent that adds character to any room. Each piece has unique wood grain.',
    shortDescription: 'Reclaimed wood and iron pipe industrial accent table.',
    category: 'table', brand: 'ArtisanCraft', price: 199,
    stock: 30, rating: 4.4, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=800&h=800&fit=crop',
    ],
    tags: ['table', 'industrial', 'reclaimed', 'side-table'],
  },

  // ── LIGHTING (6 products) ──
  {
    title: 'Brass Pendant Light',
    description: 'Modern pendant light with brushed brass finish and frosted glass shade. Creates warm ambient lighting perfect for kitchen islands and dining areas.',
    shortDescription: 'Brushed brass pendant with frosted glass shade.',
    category: 'lighting', brand: 'LightDesign', price: 199, salePrice: 169,
    stock: 40, rating: 4.6, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop',
    ],
    tags: ['lighting', 'pendant', 'brass', 'modern'],
  },
  {
    title: 'Crystal Chandelier',
    description: 'Elegant tiered crystal chandelier with hand-cut prisms that scatter light beautifully. A showpiece for dining rooms, foyers, and grand living spaces.',
    shortDescription: 'Tiered hand-cut crystal chandelier for grand spaces.',
    category: 'lighting', brand: 'LightDesign', price: 899, salePrice: 719,
    stock: 6, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop',
    ],
    tags: ['lighting', 'chandelier', 'crystal', 'elegant'],
  },
  {
    title: 'Arc Floor Lamp',
    description: 'Sweeping arc floor lamp with marble base and linen drum shade. Provides overhead light without ceiling installation — ideal for reading corners.',
    shortDescription: 'Arc floor lamp with marble base and linen shade.',
    category: 'lighting', brand: 'LightDesign', price: 349,
    stock: 22, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop',
    ],
    tags: ['lighting', 'floor-lamp', 'arc', 'marble'],
  },
  {
    title: 'Adjustable Desk Lamp',
    description: 'Articulated desk lamp with LED daylight bulb and touch-dimmer control. Anti-glare design reduces eye strain during focused work sessions.',
    shortDescription: 'LED articulated desk lamp with touch dimmer.',
    category: 'lighting', brand: 'LightDesign', price: 129,
    stock: 50, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=800&fit=crop',
    ],
    tags: ['lighting', 'desk-lamp', 'led', 'adjustable'],
  },
  {
    title: 'Rattan Globe Pendant',
    description: 'Hand-woven rattan globe pendant light that casts beautiful dappled shadow patterns. Brings organic warmth to bedrooms and casual dining spaces.',
    shortDescription: 'Hand-woven rattan globe pendant with dappled shadows.',
    category: 'lighting', brand: 'ArtisanCraft', price: 179,
    stock: 28, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&h=800&fit=crop',
    ],
    tags: ['lighting', 'rattan', 'pendant', 'bohemian'],
  },
  {
    title: 'Industrial Wall Sconce',
    description: 'Matte black industrial wall sconce with exposed Edison bulb socket. Hardwired installation with on/off switch. Sold as a pair.',
    shortDescription: 'Matte black wall sconce pair for industrial interiors.',
    category: 'lighting', brand: 'LightDesign', price: 149, salePrice: 119,
    stock: 35, rating: 4.4, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    ],
    tags: ['lighting', 'sconce', 'industrial', 'wall'],
  },

  // ── DECOR (6 products) ──
  {
    title: 'Handcrafted Ceramic Vase',
    description: 'Artisan-made ceramic vase with natural glaze in warm earth tones. Perfect for dried botanicals, fresh flowers, or as a standalone sculptural accent.',
    shortDescription: 'Artisan ceramic vase with organic earth-tone glaze.',
    category: 'decor', brand: 'ArtisanCraft', price: 129, salePrice: 116,
    stock: 50, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop',
    ],
    tags: ['decor', 'vase', 'ceramic', 'handcrafted'],
  },
  {
    title: 'Abstract Canvas Wall Art',
    description: 'Gallery-quality abstract painting printed on premium stretched canvas. Bold strokes of navy, gold, and white create a captivating focal point.',
    shortDescription: 'Premium abstract canvas print in navy, gold, and white.',
    category: 'decor', brand: 'ArtisanCraft', price: 249, salePrice: 237,
    stock: 35, rating: 4.7, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop',
    ],
    tags: ['decor', 'wall-art', 'canvas', 'abstract'],
  },
  {
    title: 'Geometric Wool Rug',
    description: 'Hand-tufted wool area rug with bold geometric patterns. Dense pile provides warmth underfoot. 8×10 ft size anchors living rooms and bedrooms beautifully.',
    shortDescription: 'Hand-tufted geometric wool rug, 8×10 ft.',
    category: 'decor', brand: 'RugDesign', price: 349, salePrice: 279,
    stock: 30, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=800&fit=crop',
    ],
    tags: ['decor', 'rug', 'wool', 'geometric'],
  },
  {
    title: 'Ornate Gold Frame Mirror',
    description: 'Full-length floor mirror with ornate antique gold frame. Adds depth and elegance to bedrooms, dressing rooms, and narrow hallways.',
    shortDescription: 'Full-length antique gold frame floor mirror.',
    category: 'decor', brand: 'ArtisanCraft', price: 399,
    stock: 12, rating: 4.8, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    ],
    tags: ['decor', 'mirror', 'gold', 'full-length'],
  },
  {
    title: 'Macramé Wall Hanging',
    description: 'Handmade cotton macramé wall tapestry with intricate knotwork. Natural ivory tone complements boho, farmhouse, and coastal interiors.',
    shortDescription: 'Handmade cotton macramé tapestry in natural ivory.',
    category: 'decor', brand: 'ArtisanCraft', price: 89,
    stock: 45, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop',
    ],
    tags: ['decor', 'macrame', 'wall-hanging', 'boho'],
  },
  {
    title: 'Wooden Bookshelf',
    description: 'Five-tier open bookshelf with solid pine shelves and matte black metal frame. Width: 30 inches. Combines storage and display in a minimalist design.',
    shortDescription: 'Five-tier pine and metal open bookshelf, 30" wide.',
    category: 'decor', brand: 'WoodCraft', price: 399, salePrice: 351,
    stock: 18, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop',
    ],
    tags: ['decor', 'bookshelf', 'storage', 'minimalist'],
  },

  // ── KITCHEN (6 products) ──
  {
    title: 'Stainless Steel Farm Sink',
    description: 'Premium 33-inch stainless steel apron-front farmhouse sink. Under-mount installation, sound-dampening pads, and satin finish resist water spots.',
    shortDescription: '33" stainless steel apron-front farmhouse sink.',
    category: 'kitchen', brand: 'KitchenPro', price: 299, salePrice: 275,
    stock: 28, rating: 4.7, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
    ],
    tags: ['kitchen', 'sink', 'stainless-steel', 'farmhouse'],
  },
  {
    title: 'Pull-Down Kitchen Faucet',
    description: 'High-arc pull-down sprayer faucet in brushed nickel. Single-handle operation with 360° swivel. Ceramic disc valves prevent drips.',
    shortDescription: 'Brushed nickel pull-down sprayer faucet, 360° swivel.',
    category: 'kitchen', brand: 'KitchenPro', price: 189,
    stock: 40, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=800&fit=crop',
    ],
    tags: ['kitchen', 'faucet', 'brushed-nickel', 'pull-down'],
  },
  {
    title: 'Shaker Style Cabinet Set',
    description: 'Complete 10-piece shaker-style kitchen cabinet set in matte white. Soft-close hinges and full-extension drawers included. Ready for 10×10 kitchen layout.',
    shortDescription: '10-piece matte white shaker cabinet set with soft-close.',
    category: 'kitchen', brand: 'KitchenPro', price: 2499, salePrice: 2124,
    stock: 5, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&h=800&fit=crop',
    ],
    tags: ['kitchen', 'cabinets', 'shaker', 'white'],
  },
  {
    title: 'Bamboo Drawer Organizer',
    description: 'Expandable bamboo drawer organizer for utensils and cutlery. Adjustable compartments fit standard kitchen drawers 12"–18" wide.',
    shortDescription: 'Expandable bamboo utensil drawer organizer.',
    category: 'kitchen', brand: 'ArtisanCraft', price: 39,
    stock: 80, rating: 4.4, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&h=800&fit=crop',
    ],
    tags: ['kitchen', 'organizer', 'bamboo', 'drawer'],
  },
  {
    title: 'Marble Cutting Board',
    description: 'Polished white marble cutting and serving board with leather hanging strap. Heat-resistant surface ideal for cheese boards and pastry rolling.',
    shortDescription: 'White marble cutting and serving board with leather strap.',
    category: 'kitchen', brand: 'MarbleHome', price: 59,
    stock: 60, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1594794112455-6e3e57f2a15f?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594794112455-6e3e57f2a15f?w=800&h=800&fit=crop',
    ],
    tags: ['kitchen', 'cutting-board', 'marble', 'serving'],
  },
  {
    title: 'Cast Iron Pot Rack',
    description: 'Ceiling-mounted cast iron pot rack with 10 S-hooks. Industrial farmhouse design keeps cookware organized and within reach. Supports up to 60 lbs.',
    shortDescription: 'Ceiling-mount cast iron pot rack with 10 hooks.',
    category: 'kitchen', brand: 'KitchenPro', price: 149, salePrice: 127,
    stock: 22, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=800&fit=crop',
    ],
    tags: ['kitchen', 'pot-rack', 'cast-iron', 'storage'],
  },

  // ── BATHROOM (6 products) ──
  {
    title: 'Floating Vanity Cabinet',
    description: 'Wall-mounted floating vanity with integrated ceramic basin and soft-close drawers. Clean lines in matte white bring modern elegance to any bathroom.',
    shortDescription: 'Wall-mounted floating vanity with integrated basin.',
    category: 'bathroom', brand: 'BathDesign', price: 699, salePrice: 629,
    stock: 12, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1620626011161-997c51447385?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1620626011161-997c51447385?w=800&h=800&fit=crop',
    ],
    tags: ['bathroom', 'vanity', 'floating', 'modern'],
  },
  {
    title: 'LED Mirror Cabinet',
    description: 'Recessed medicine cabinet with LED-lit mirror, anti-fog function, and USB charging port. Three adjustable shelves provide ample storage.',
    shortDescription: 'LED mirror medicine cabinet with anti-fog and USB.',
    category: 'bathroom', brand: 'BathDesign', price: 349,
    stock: 18, rating: 4.7, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=800&fit=crop',
    ],
    tags: ['bathroom', 'mirror', 'led', 'cabinet'],
  },
  {
    title: 'Rainfall Shower Head',
    description: '12-inch ceiling-mounted rainfall shower head in matte black. Ultra-thin design with self-cleaning silicone nozzles for consistent water flow.',
    shortDescription: '12" matte black ceiling rainfall shower head.',
    category: 'bathroom', brand: 'BathDesign', price: 179, salePrice: 152,
    stock: 30, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&h=800&fit=crop',
    ],
    tags: ['bathroom', 'shower', 'rainfall', 'matte-black'],
  },
  {
    title: 'Teak Shower Bench',
    description: 'Spa-quality teak wood shower bench with slatted design for water drainage. Naturally water-resistant — no sealing required. Supports up to 250 lbs.',
    shortDescription: 'Spa-grade teak shower bench, naturally water-resistant.',
    category: 'bathroom', brand: 'WoodCraft', price: 129,
    stock: 25, rating: 4.8, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=800&fit=crop',
    ],
    tags: ['bathroom', 'bench', 'teak', 'spa'],
  },
  {
    title: 'Brushed Gold Towel Rack',
    description: 'Wall-mounted double towel bar in brushed gold finish. Solid brass construction with concealed mounting hardware. Length: 24 inches.',
    shortDescription: '24" brushed gold double towel bar in solid brass.',
    category: 'bathroom', brand: 'BathDesign', price: 89,
    stock: 40, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1603825491103-bd638b1873b0?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1603825491103-bd638b1873b0?w=800&h=800&fit=crop',
    ],
    tags: ['bathroom', 'towel-rack', 'gold', 'brass'],
  },
  {
    title: 'Freestanding Soaking Tub',
    description: 'Sculpted freestanding acrylic soaking tub with a glossy white finish. 67-inch length with built-in overflow drain. A spa-like retreat at home.',
    shortDescription: '67" freestanding acrylic soaking tub in glossy white.',
    category: 'bathroom', brand: 'BathDesign', price: 1599, salePrice: 1359,
    stock: 4, rating: 4.9, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=800&fit=crop',
    ],
    tags: ['bathroom', 'bathtub', 'freestanding', 'soaking'],
  },

  // ── OUTDOOR (6 products) ──
  {
    title: 'Wicker Patio Lounge Set',
    description: 'All-weather PE wicker 4-piece patio set: 2 armchairs, loveseat, and tempered glass coffee table. UV-resistant cushions in neutral grey.',
    shortDescription: '4-piece all-weather wicker patio lounge set.',
    category: 'outdoor', brand: 'OutdoorLiving', price: 899, salePrice: 764,
    stock: 8, rating: 4.7, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=800&fit=crop',
    ],
    tags: ['outdoor', 'wicker', 'patio', 'lounge-set'],
  },
  {
    title: 'Teak Garden Bench',
    description: 'Classic 5-foot teak garden bench with contoured backrest. Grade-A teak weathers to a silver patina over time. Perfect for gardens, parks, and porches.',
    shortDescription: '5-foot grade-A teak garden bench with contoured back.',
    category: 'outdoor', brand: 'OutdoorLiving', price: 549,
    stock: 14, rating: 4.8, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&h=800&fit=crop',
    ],
    tags: ['outdoor', 'bench', 'teak', 'garden'],
  },
  {
    title: 'Folding Bistro Chair',
    description: 'Powder-coated steel folding bistro chair inspired by Parisian café style. Lightweight, stackable, and weather-resistant. Sold individually.',
    shortDescription: 'Foldable steel bistro chair in classic café style.',
    category: 'outdoor', brand: 'OutdoorLiving', price: 89,
    stock: 50, rating: 4.5, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=800&fit=crop',
    ],
    tags: ['outdoor', 'bistro', 'folding', 'café'],
  },
  {
    title: 'Cantilever Patio Umbrella',
    description: '10-foot offset cantilever umbrella with crank lift and 360° rotation. Sunbrella fabric provides 98% UV protection. Base sold separately.',
    shortDescription: '10-foot offset umbrella with UV-protective Sunbrella fabric.',
    category: 'outdoor', brand: 'OutdoorLiving', price: 299, salePrice: 254,
    stock: 20, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=800&fit=crop',
    ],
    tags: ['outdoor', 'umbrella', 'cantilever', 'patio'],
  },
  {
    title: 'Stone Fire Pit Table',
    description: 'Propane gas fire pit table with natural stone finish. 50,000 BTU burner with electronic ignition. Includes lava rocks and weather cover.',
    shortDescription: 'Propane fire pit table with natural stone finish.',
    category: 'outdoor', brand: 'OutdoorLiving', price: 699,
    stock: 10, rating: 4.8, featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=800&fit=crop',
    ],
    tags: ['outdoor', 'fire-pit', 'propane', 'stone'],
  },
  {
    title: 'Hammock with Stand',
    description: 'Double cotton rope hammock with heavy-duty steel stand. Supports up to 450 lbs. Quick setup with no trees required. Includes carrying bag.',
    shortDescription: 'Double cotton hammock with freestanding steel frame.',
    category: 'outdoor', brand: 'OutdoorLiving', price: 199, salePrice: 169,
    stock: 25, rating: 4.6, featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=800&fit=crop',
    ],
    tags: ['outdoor', 'hammock', 'cotton', 'freestanding'],
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Clear existing data
    console.log('Cleaning collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Coupon.deleteMany({});
    await Review.deleteMany({});
    console.log('Collections cleared.');

    // 2. Insert Categories
    console.log('Seeding categories...');
    const categories = await Category.insertMany(categoriesData);
    console.log(`Created ${categories.length} categories.`);

    // 3. Insert Users (20 users)
    console.log('Seeding users...');
    const usersToCreate = [];

    // Create 1 Admin
    usersToCreate.push({
      name: 'Admin User',
      email: 'admin@email.com',
      password: '12345678',
      phone: '+1 800 555 0199',
      role: 'admin',
      addresses: [
        {
          street: '100 Admin Plaza',
          city: 'Tech City',
          state: 'CA',
          zipCode: '90001',
          country: 'United States',
          isDefault: true
        }
      ]
    });

    // Create 19 Customers
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jessica', 'James', 'Ashley', 'Joseph', 'Amanda', 'Charles', 'Mary', 'Thomas', 'Patricia', 'Daniel'];
    const lastNames = ['Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris', 'Martin'];

    for (let i = 0; i < 19; i++) {
      const name = `${firstNames[i]} ${lastNames[i]}`;
      const email = `customer${i + 1}@swiftcart.com`;
      usersToCreate.push({
        name,
        email,
        password: 'password123',
        phone: `+1 555 01${10 + i}`,
        role: 'customer',
        addresses: [
          {
            street: `${123 + i * 5} Main Street`,
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'United States',
            isDefault: true
          }
        ]
      });
    }

    const createdUsers = await User.create(usersToCreate);
    console.log(`Created ${createdUsers.length} users (1 admin, 19 customers).`);

    // 4. Seed Products from curated catalog
    console.log('Seeding products...');
    const productsToCreate = curatedProducts.map((p, i) => {
      const specs = {
        'Material': 'Premium Quality Materials',
        'Warranty': '2 Years Limited',
        'Assembly Required': 'Yes',
        'Origin': 'Imported',
        ...(p.specifications || {})
      };
      return {
        ...p,
        SKU: `SC-${p.category.toUpperCase().slice(0, 3)}-${1000 + i}`,
        discountPercentage: p.salePrice ? Math.round(((p.price - p.salePrice) / p.price) * 100) : 0,
        totalReviews: 0,
        specifications: new Map(Object.entries(specs)),
        active: true,
      };
    });

    const createdProducts = await Product.create(productsToCreate);
    console.log(`Created ${createdProducts.length} products.`);

    // 5. Seed Coupons
    console.log('Seeding coupons...');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const coupons = await Coupon.insertMany([
      { code: 'WELCOME10', percentage: 10, expiry: nextYear },
      { code: 'SUMMER20', percentage: 20, expiry: nextYear },
      { code: 'FREESHIP', amount: 10, expiry: nextYear }
    ]);
    console.log(`Created ${coupons.length} coupons.`);

    // 6. Seed Reviews (Add 2-3 reviews per product)
    console.log('Seeding reviews and calculating averages...');
    const reviewsToCreate = [];
    const comments = [
      'Amazing product! Highly recommend to everyone.',
      'Decent quality for the price. Happy with my purchase.',
      'Looks beautiful in my living room. Smooth delivery.',
      'Very comfortable and durable. Exceeded my expectations.',
      'Easy to assemble, fits description perfectly.',
      'Good customer support. Satisfactory product.',
      'Premium feel and classic look. Very satisfied!'
    ];

    // Seed reviews for first 30 products
    for (let i = 0; i < 30; i++) {
      const prod = createdProducts[i];
      const numReviews = Math.floor(Math.random() * 3) + 1; // 1 to 3 reviews
      
      for (let r = 0; r < numReviews; r++) {
        // Pick a random customer
        const user = createdUsers[Math.floor(Math.random() * (createdUsers.length - 1)) + 1]; // Skip admin
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        const comment = comments[Math.floor(Math.random() * comments.length)];

        reviewsToCreate.push({
          product: prod._id,
          user: user._id,
          userName: user.name,
          rating,
          review: comment,
          verified: Math.random() > 0.2
        });
      }
    }

    await Review.insertMany(reviewsToCreate);
    console.log(`Created ${reviewsToCreate.length} reviews.`);

    // Update product ratings in database
    console.log('Updating product review counts and average ratings...');
    for (const prod of createdProducts) {
      const prodReviews = await Review.find({ product: prod._id });
      const count = prodReviews.length;
      if (count > 0) {
        const sum = prodReviews.reduce((acc, item) => acc + item.rating, 0);
        prod.rating = Number((sum / count).toFixed(1));
        prod.totalReviews = count;
        await prod.save();
      }
    }
    console.log('Seeding successfully completed!');
  } catch (error) {
    console.error('Seeding Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seed();
