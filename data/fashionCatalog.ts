import { Product } from '@/types';

export const fashionProducts: Product[] = [
  // --- 10 DRESS ROOM FEATURE OUTFITS (WITH PRODUCT & MODEL WEARING IMAGES) ---
  {
    id: 501,
    title: 'Oversized Silk White Shirt',
    slug: 'oversized-silk-white-shirt',
    description: 'A luxurious oversized button-down shirt crafted in lightweight pure mulberry silk. Features a clean architectural collar, mother-of-pearl buttons, and relaxed dropped shoulders for effortless day-to-evening dressing.',
    price: 125,
    originalPrice: 145,
    discountPercentage: 14,
    rating: 4.9,
    stock: 35,
    brand: 'Swift Atelier',
    category: 'top',
    thumbnail: '/images/dress-room/white-silk-shirt-product.jpg',
    productImage: '/images/dress-room/white-silk-shirt-product.jpg',
    modelWearingImage: '/images/dress-room/white-silk-shirt-model.jpg',
    images: ['/images/dress-room/white-silk-shirt-product.jpg'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#ffffff',
      'Material': '100% Mulberry Silk',
      'Fabric': 'Lustrous lightweight silk crepe',
      'Occasion': 'luxury, evening, editorial'
    },
    tags: ['New', 'Bestseller', 'Featured']
  },
  {
    id: 502,
    title: 'Emerald Linen Camp Collar Shirt',
    slug: 'emerald-linen-camp-collar-shirt',
    description: "A tailored men's resort shirt tailored from premium breathable European flax linen in a rich emerald green shade. Finished with a relaxed camp collar and single chest welt pocket.",
    price: 89,
    originalPrice: 110,
    discountPercentage: 19,
    rating: 4.8,
    stock: 28,
    brand: 'Swift Atelier',
    category: 'top',
    thumbnail: '/images/dress-room/emerald-linen-shirt-product.jpg',
    productImage: '/images/dress-room/emerald-linen-shirt-product.jpg',
    modelWearingImage: '/images/dress-room/emerald-linen-shirt-model.jpg',
    images: ['/images/dress-room/emerald-linen-shirt-product.jpg'],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#0a5c36',
      'Material': '100% European Flax Linen',
      'Fabric': 'Textured breathable woven linen',
      'Occasion': 'resort, casual, summer'
    },
    tags: ['New', 'Featured']
  },
  {
    id: 503,
    title: 'Floral Silk Slip Evening Dress',
    slug: 'floral-silk-slip-evening-dress',
    description: 'An ethereal midi-length slip evening dress rendered in fluid deep burgundy silk jacquard with delicate tonal floral motifs. Designed with a draped cowl neckline and side leg slit.',
    price: 185,
    originalPrice: 220,
    discountPercentage: 16,
    rating: 4.9,
    stock: 22,
    brand: 'Swift Atelier',
    category: 'dress',
    thumbnail: '/images/dress-room/floral-silk-dress-product.jpg',
    productImage: '/images/dress-room/floral-silk-dress-product.jpg',
    modelWearingImage: '/images/dress-room/floral-silk-dress-model.jpg',
    images: ['/images/dress-room/floral-silk-dress-product.jpg'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#58111a',
      'Material': '100% Silk Charmeuse',
      'Fabric': 'High-drape silk jacquard',
      'Occasion': 'evening, gala, cocktail'
    },
    tags: ['New', 'Bestseller']
  },
  {
    id: 504,
    title: 'Minimalist Noir Bodycon Midi Dress',
    slug: 'minimalist-noir-bodycon-midi-dress',
    description: 'A sculptural black ribbed-knit midi dress with a square neckline and body-skimming silhouette. Engineered in compact stretch viscose for comfortable all-day hold.',
    price: 135,
    originalPrice: 160,
    discountPercentage: 15,
    rating: 4.8,
    stock: 30,
    brand: 'Swift Atelier',
    category: 'dress',
    thumbnail: '/images/dress-room/noir-bodycon-dress-product.jpg',
    productImage: '/images/dress-room/noir-bodycon-dress-product.jpg',
    modelWearingImage: '/images/dress-room/noir-bodycon-dress-model.jpg',
    images: ['/images/dress-room/noir-bodycon-dress-product.jpg'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#111111',
      'Material': '80% Viscose, 20% Polyamide',
      'Fabric': 'Compact vertical ribbed knit',
      'Occasion': 'contemporary, minimalist, evening'
    },
    tags: ['New', 'Featured']
  },
  {
    id: 505,
    title: 'Tailored Camel Wool Trench Coat',
    slug: 'tailored-camel-wool-trench-coat',
    description: 'A double-breasted outerwear masterpiece crafted in double-faced Italian camel virgin wool. Features epaulets, storm flaps, and a matching belt with buckle.',
    price: 295,
    originalPrice: 350,
    discountPercentage: 15,
    rating: 5.0,
    stock: 18,
    brand: 'Swift Atelier',
    category: 'jacket',
    thumbnail: '/images/dress-room/camel-wool-trench-product.jpg',
    productImage: '/images/dress-room/camel-wool-trench-product.jpg',
    modelWearingImage: '/images/dress-room/camel-wool-trench-model.jpg',
    images: ['/images/dress-room/camel-wool-trench-product.jpg'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#c19a6b',
      'Material': '100% Virgin Wool',
      'Fabric': 'Double-faced Italian melton wool',
      'Occasion': 'autumn, winter, luxury'
    },
    tags: ['New', 'Bestseller', 'Featured']
  },
  {
    id: 506,
    title: 'Vintage Distressed Denim Trucker Jacket',
    slug: 'vintage-distressed-denim-trucker-jacket',
    description: 'An authentic heavy-duty 14oz rigid cotton denim trucker jacket in an authentic vintage stonewash finish with antique brass buttons and chest flap pockets.',
    price: 119,
    originalPrice: 140,
    discountPercentage: 15,
    rating: 4.7,
    stock: 40,
    brand: 'Swift Denim Co.',
    category: 'jacket',
    thumbnail: '/images/dress-room/denim-trucker-jacket-product.jpg',
    productImage: '/images/dress-room/denim-trucker-jacket-product.jpg',
    modelWearingImage: '/images/dress-room/denim-trucker-jacket-model.jpg',
    images: ['/images/dress-room/denim-trucker-jacket-product.jpg'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#466d8c',
      'Material': '100% Organic Cotton Denim',
      'Fabric': '14oz rigid selvedge denim',
      'Occasion': 'streetwear, casual, heritage'
    },
    tags: ['New']
  },
  {
    id: 507,
    title: 'Asymmetric Black Leather Biker Jacket',
    slug: 'asymmetric-black-leather-biker-jacket',
    description: 'Handcrafted in buttery full-grain lambskin leather with heavy-gauge silver metal hardware, asymmetrical front zip, notched lapels, and adjustable waist buckles.',
    price: 340,
    originalPrice: 420,
    discountPercentage: 19,
    rating: 4.9,
    stock: 15,
    brand: 'Swift Atelier',
    category: 'jacket',
    thumbnail: '/images/dress-room/black-leather-biker-product.jpg',
    productImage: '/images/dress-room/black-leather-biker-product.jpg',
    modelWearingImage: '/images/dress-room/black-leather-biker-model.jpg',
    images: ['/images/dress-room/black-leather-biker-product.jpg'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#0d0d0d',
      'Material': '100% Full-Grain Lambskin Leather',
      'Fabric': 'Plonge lambskin, silky satin lining',
      'Occasion': 'edgy, streetwear, night out'
    },
    tags: ['New', 'Featured']
  },
  {
    id: 508,
    title: 'High-Rise Pleated Wide-Leg Trousers',
    slug: 'high-rise-pleated-wide-leg-trousers',
    description: 'Sculptural high-waisted wide-leg trousers in a tailored cream twill weave. Features deep front pleats, pressed center creases, and slant side pockets for a clean silhouette.',
    price: 115,
    originalPrice: 135,
    discountPercentage: 14,
    rating: 4.8,
    stock: 25,
    brand: 'Swift Atelier',
    category: 'pants',
    thumbnail: '/images/dress-room/cream-wide-trousers-product.jpg',
    productImage: '/images/dress-room/cream-wide-trousers-product.jpg',
    modelWearingImage: '/images/dress-room/cream-wide-trousers-model.jpg',
    images: ['/images/dress-room/cream-wide-trousers-product.jpg'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#ece6da',
      'Material': '70% Wool, 30% Silk Twill',
      'Fabric': 'High-density drape twill',
      'Occasion': 'quiet luxury, professional, formal'
    },
    tags: ['New', 'Bestseller']
  },
  {
    id: 509,
    title: 'Relaxed Raw Indigo Denim Jeans',
    slug: 'relaxed-raw-indigo-denim-jeans',
    description: 'Crafted from unwashed raw Japanese selvedge denim in deep indigo blue. Cut in a modern relaxed straight-leg fit designed to develop unique personal fade patterns.',
    price: 98,
    originalPrice: 120,
    discountPercentage: 18,
    rating: 4.7,
    stock: 32,
    brand: 'Swift Denim Co.',
    category: 'pants',
    thumbnail: '/images/dress-room/raw-indigo-jeans-product.jpg',
    productImage: '/images/dress-room/raw-indigo-jeans-product.jpg',
    modelWearingImage: '/images/dress-room/raw-indigo-jeans-model.jpg',
    images: ['/images/dress-room/raw-indigo-jeans-product.jpg'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'unisex',
      'Color': '#1a233a',
      'Material': '100% Japanese Selvedge Cotton',
      'Fabric': '13.5oz raw rigid denim',
      'Occasion': 'casual, streetwear, everyday'
    },
    tags: ['New']
  },
  {
    id: 510,
    title: 'Chunky Cable Knit Cashmere Sweater',
    slug: 'chunky-cable-knit-cashmere-sweater',
    description: 'A decadent oversized knit sweater woven from 100% pure Mongolian cashmere in a rich oat-cream shade. Detailed with heritage rope cable motifs and ribbed trims.',
    price: 175,
    originalPrice: 210,
    discountPercentage: 16,
    rating: 4.9,
    stock: 20,
    brand: 'Swift Atelier',
    category: 'top',
    thumbnail: '/images/dress-room/cashmere-knit-sweater-product.jpg',
    productImage: '/images/dress-room/cashmere-knit-sweater-product.jpg',
    modelWearingImage: '/images/dress-room/cashmere-knit-sweater-model.jpg',
    images: ['/images/dress-room/cashmere-knit-sweater-product.jpg'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e6ded3',
      'Material': '100% Mongolian Cashmere',
      'Fabric': '7-gauge 4-ply chunky cable knit',
      'Occasion': 'cozy, autumn, winter luxury'
    },
    tags: ['New', 'Bestseller', 'Featured']
  },

  // --- EXISTING CATALOG PRODUCTS (PRESERVED) ---
  {
    id: 101,
    title: 'Cropped Ribbed Knit Tank',
    description: 'A premium cropped tank top knitted in soft, ribbed organic cotton. Features a sleek scoop neck and flatlock seams for ultimate comfort. Designed to flatter and fit close to the body, perfect for layering or wearing standalone during warm weather.',
    price: 39,
    discountPercentage: 5,
    rating: 4.7,
    stock: 45,
    brand: 'ZaraStyle',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e3dac9', // Cream
      'Material': '95% Organic Cotton, 5% Elastane',
      'Fabric': 'Ribbed stretch knit, lightweight & breathable',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'minimalist, summer, casual',
      'SvgStyle': 'tank',
      'SvgColor': '#f5f0e6'
    },
    tags: ['Bestseller', 'New'],
    variants: [
      {
        id: 'var-size',
        name: 'Size',
        options: [
          { id: 'opt-xs', name: 'Size', value: 'XS', stock: 10 },
          { id: 'opt-s', name: 'Size', value: 'S', stock: 15 },
          { id: 'opt-m', name: 'Size', value: 'M', stock: 12 },
          { id: 'opt-l', name: 'Size', value: 'L', stock: 8 },
        ],
      },
      {
        id: 'var-color',
        name: 'Color',
        options: [
          { id: 'opt-cream', name: 'Color', value: 'Cream', colorHex: '#e3dac9', stock: 25 },
          { id: 'opt-black', name: 'Color', value: 'Noir Black', colorHex: '#1a1a1a', stock: 20 },
        ],
      },
    ],
    reviewCount: 28,
    ratingDistribution: { 5: 20, 4: 5, 3: 2, 2: 1, 1: 0 },
    shippingInfo: {
      estimate: 'Fast 2-3 Business Days Delivery',
      freeShipping: true,
      returnPolicy: '30-day effortless return window',
      cost: 0,
    },
    reviews: [
      {
        id: 'rev-101-1',
        userId: 'usr-1',
        userName: 'Emma Watson',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        rating: 5,
        comment: 'Softest organic cotton knit I have ever worn! True to size.',
        date: '2026-06-10',
        verified: true,
        helpfulCount: 18,
      },
      {
        id: 'rev-101-2',
        userId: 'usr-2',
        userName: 'Jessica Alba',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
        rating: 4,
        comment: 'Beautiful cream shade, pairs amazingly with high-waisted denim.',
        date: '2026-05-28',
        verified: true,
        helpfulCount: 7,
      },
    ]
  },
  {
    id: 102,
    title: 'Cozy Cable Knit Sweater',
    description: 'An oversized, warm cable-knit sweater made from premium wool blend. Exquisitely detailed stitching patterns offer a classic heritage look while the modern slouchy silhouette ensures casual ease. Perfect for cold autumn and winter layering.',
    price: 89,
    discountPercentage: 10,
    rating: 4.8,
    stock: 25,
    brand: 'H&MClassic',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#8a7d72', // Taupe/Muted Brown
      'Material': '60% Merino Wool, 40% Recycled Nylon',
      'Fabric': 'Heavyweight cable weave, extremely soft and warm',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'cozy, winter, casual',
      'SvgStyle': 'sweater',
      'SvgColor': '#9c8e82'
    }
  },
  {
    id: 103,
    title: 'High-Rise Denim Jeans',
    description: 'Classic straight-leg denim jeans in a vintage wash. Crafted from heavyweight rigid cotton denim that softens beautifully over time. High-rise fit hugs your waist while maintaining a relaxed straight fit through the legs.',
    price: 79,
    discountPercentage: 12,
    rating: 4.6,
    stock: 35,
    brand: 'ZaraStyle',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#4a6b82', // Denim Blue
      'Material': '100% Rigid Organic Cotton',
      'Fabric': '13.5 oz heavy denim, classic twilight wash',
      'Delivery': '2-4 Business Days',
      'Occasion': 'casual, office',
      'StyleTags': 'streetwear, denim, vintage',
      'SvgStyle': 'jeans',
      'SvgColor': '#5888a5'
    }
  },
  {
    id: 104,
    title: 'Tailored Linen Trouser',
    description: 'Lightweight and airy wide-leg trousers tailored in pure flax linen. Featuring a high-rise waist with crisp double pleats, belt loops, and hidden front closure. Offers effortless elegance for warm-weather office chic or weekend resort wear.',
    price: 95,
    discountPercentage: 0,
    rating: 4.9,
    stock: 18,
    brand: 'ZaraStyle',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#dfdcd6', // Linen Beige
      'Material': '100% European Flax Linen',
      'Fabric': 'Lightweight plain weave, breathable & pre-washed',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual, seasonal',
      'StyleTags': 'resort, smart-casual, office',
      'SvgStyle': 'pants',
      'SvgColor': '#e3ded5'
    }
  },
  {
    id: 105,
    title: 'Floral Silk Slip Dress',
    description: 'An elegant midi slip dress cut on the bias from luxurious mulberry silk. Adorned with a delicate watercolor floral print. Features skinny adjustable shoulder straps and a graceful cowl neck. Fits beautifully to outline the silhouette.',
    price: 180,
    discountPercentage: 15,
    rating: 4.9,
    stock: 12,
    brand: 'ZaraStyle',
    category: 'dress',
    thumbnail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#e2b3c2', // Blush Floral
      'Material': '100% Mulberry Silk',
      'Fabric': 'Ultra-soft, satin-faced silk charmeuse',
      'Delivery': '1-2 Business Days (Express)',
      'Occasion': 'party, wedding, seasonal',
      'StyleTags': 'luxury, wedding-guest, summer-party',
      'SvgStyle': 'dress',
      'SvgColor': '#cca3b0'
    }
  },
  {
    id: 106,
    title: 'Oversized Classic Trench Coat',
    description: 'A timeless double-breasted trench coat tailored in durable cotton gabardine. Features adjustable shoulder epaulets, belted cuffs, a removable storm flap, and matching waist belt. Provides water resistance and effortless Parisian elegance.',
    price: 220,
    discountPercentage: 8,
    rating: 4.8,
    stock: 15,
    brand: 'H&MClassic',
    category: 'jacket',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#c8b195', // Khaki/Camel
      'Material': '100% Water-Resistant Cotton Gabardine',
      'Fabric': 'Densely woven weather-resistant gabardine',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual, seasonal',
      'StyleTags': 'classic, autumn, layering',
      'SvgStyle': 'trench',
      'SvgColor': '#d0bc9c'
    }
  },
  {
    id: 107,
    title: 'Minimalist Leather Shoulder Bag',
    description: 'A structural shoulder bag crafted in smooth, full-grain Italian leather. Features a curved silhouette, thin adjustable strap, zip closure, and interior patch pockets. Finished with minimal silver-tone hardware for a refined aesthetic.',
    price: 150,
    discountPercentage: 0,
    rating: 4.7,
    stock: 20,
    brand: 'ZaraStyle',
    category: 'bag',
    thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'bag',
      'Gender': 'female',
      'Color': '#1c1c1c', // Black
      'Material': '100% Italian Nappa Leather, Cotton Lining',
      'Fabric': 'Smooth leather finish with custom grain detailing',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, office, party',
      'StyleTags': 'accessory, luxury, sleek',
      'SvgStyle': 'bag',
      'SvgColor': '#2b2b2b'
    }
  },
  {
    id: 108,
    title: 'Gold Hoop Earrings & Necklace Set',
    description: 'A curated jewelry set featuring a 14k gold-plated choker chain and matching chunky round hoop earrings. Hypoallergenic, lightweight, and perfect for adding polished elegance to any basic top or cocktail dress.',
    price: 45,
    discountPercentage: 10,
    rating: 4.9,
    stock: 50,
    brand: 'ZaraStyle',
    category: 'jewelry',
    thumbnail: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jewelry',
      'Gender': 'female',
      'Color': '#ffd700', // Gold
      'Material': '14k Gold-Plated Recycled Brass',
      'Fabric': 'Polished high-shine gold plating',
      'Delivery': '2-3 Business Days',
      'Occasion': 'party, office, wedding',
      'StyleTags': 'accessory, gold, chic',
      'SvgStyle': 'necklace',
      'SvgColor': '#ffd700'
    }
  },

  // --- MALE CATEGORY ---
  {
    id: 201,
    title: 'Premium Heavyweight Cotton Tee',
    description: 'A structured crewneck t-shirt knitted from robust, 280gsm long-staple combed cotton. Offers an elegant dry-loop texture and a boxy, modern fit that retains its shape even after multiple washes. The ultimate wardrobe staple.',
    price: 35,
    discountPercentage: 0,
    rating: 4.8,
    stock: 60,
    brand: 'H&MClassic',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#ffffff', // White
      'Material': '100% Combed Organic Cotton',
      'Fabric': '280gsm heavyweight jersey knit, pre-shrunk',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'minimalist, streetwear, everyday',
      'SvgStyle': 'tshirt',
      'SvgColor': '#fcfcfc'
    }
  },
  {
    id: 202,
    title: 'Relaxed Oxford Cotton Shirt',
    description: 'A classic button-down shirt constructed from premium long-fiber Oxford cotton fabric. Featuring a relaxed modern drape, chest pocket, curved hem, and mother-of-pearl buttons. Pre-washed for a soft texture and immediate comfort.',
    price: 65,
    discountPercentage: 8,
    rating: 4.7,
    stock: 40,
    brand: 'H&MClassic',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#a0c4de', // Light Blue
      'Material': '100% Long-Fiber Cotton',
      'Fabric': 'Medium weight Oxford weave, breathable & soft',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual',
      'StyleTags': 'smart-casual, preppy, office',
      'SvgStyle': 'shirt',
      'SvgColor': '#cbdceb'
    }
  },
  {
    id: 203,
    title: 'Streetwear Cargo Utility Pants',
    description: 'Rugged cargo pants crafted in heavy cotton ripstop fabric. Designed with an elastic waistband, internal drawstrings, articulated knees, and multiple utility flap pockets. Perfect for a functional, utilitarian street aesthetic.',
    price: 85,
    discountPercentage: 15,
    rating: 4.5,
    stock: 30,
    brand: 'NikeSports',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'male',
      'Color': '#3d4b3c', // Olive Green
      'Material': '98% Cotton Ripstop, 2% Elastane',
      'Fabric': 'Woven ripstop cotton, abrasion-resistant',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'streetwear, utility, outdoor',
      'SvgStyle': 'cargo',
      'SvgColor': '#586b57'
    }
  },
  {
    id: 204,
    title: 'Classic Relaxed Chino',
    description: 'A versatile flat-front chino trouser made from exceptionally soft cotton-twill stretch fabric. Features double-welt back pockets, side slant pockets, and a clean tapered hem. Ideal for effortless transitions from desk to dinner.',
    price: 69,
    discountPercentage: 0,
    rating: 4.6,
    stock: 45,
    brand: 'H&MClassic',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'male',
      'Color': '#c2b29a', // Sand Beige
      'Material': '97% Cotton Twill, 3% Lycra',
      'Fabric': 'Mid-weight stretch twill fabric',
      'Delivery': '2-4 Business Days',
      'Occasion': 'office, casual',
      'StyleTags': 'smart-casual, office, preppy',
      'SvgStyle': 'chinos',
      'SvgColor': '#d8ccb9'
    }
  },
  {
    id: 205,
    title: 'Eco-Leather Bomber Jacket',
    description: 'A sleek bomber jacket crafted in premium vegan eco-leather. Features a rib-knit collar, hem, and cuffs, soft satin lining, silver zip closure, and angled snap pockets. Delivers a classic masculine edge with a modern eco-conscious design.',
    price: 140,
    discountPercentage: 10,
    rating: 4.8,
    stock: 22,
    brand: 'ZaraStyle',
    category: 'jacket',
    thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#1a1a1a', // Dark Espresso
      'Material': '100% Water-Resistant Polyurethane (Vegan Leather)',
      'Fabric': 'Soft grain vegan leather, matte finish',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, party',
      'StyleTags': 'edgy, winter, streetwear',
      'SvgStyle': 'bomber',
      'SvgColor': '#2d2d2d'
    }
  },
  {
    id: 206,
    title: 'Retro Denim Trucker Jacket',
    description: 'An iconic classic trucker jacket built in heavy raw-indigo denim. Featuring double chest flap pockets, waist tabs, and copper buttons. Boxy retro cut, perfect for double-denim looks or layering over white t-shirts.',
    price: 110,
    discountPercentage: 5,
    rating: 4.7,
    stock: 20,
    brand: 'ZaraStyle',
    category: 'jacket',
    thumbnail: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#3b5266', // Indigo Blue
      'Material': '100% Heavyweight Cotton Denim',
      'Fabric': '14 oz raw denim, structured copper hardware',
      'Delivery': '2-4 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'classic, vintage, layering',
      'SvgStyle': 'denimJacket',
      'SvgColor': '#4d6980'
    }
  },
  {
    id: 207,
    title: 'Air Platform Sneakers',
    description: 'Sporty retro sneakers designed with a layered leather and mesh upper, supported by a chunky cushioned air platform sole. Combines heritage Nike running aesthetics with absolute daily comfort.',
    price: 120,
    discountPercentage: 0,
    rating: 4.9,
    stock: 50,
    brand: 'NikeSports',
    category: 'shoes',
    thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'unisex',
      'Color': '#f34c23', // Bright Orange-Red accents
      'Material': '40% Premium Leather, 30% Mesh, Rubber Outsole',
      'Fabric': 'Breathable athletic composite upper',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'athletic, streetwear, comfort',
      'SvgStyle': 'sneakers',
      'SvgColor': '#e5e5e5'
    }
  },
  {
    id: 208,
    title: 'Classic Leather Chelsea Boots',
    description: 'A refined pair of pull-on Chelsea boots built in hand-finished full-grain leather. Designed with a flexible elastic side gusset, pull tabs, and robust Goodyear welted soles. Offers sophisticated masculine flair for formal or smart casual settings.',
    price: 160,
    discountPercentage: 10,
    rating: 4.8,
    stock: 15,
    brand: 'H&MClassic',
    category: 'shoes',
    thumbnail: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'male',
      'Color': '#5c4033', // Dark Brown
      'Material': '100% Full-Grain Calfskin Leather',
      'Fabric': 'Waxed burnished finish, leather lining',
      'Delivery': '3-5 Business Days',
      'Occasion': 'office, casual, wedding',
      'StyleTags': 'smart, classic, formal',
      'SvgStyle': 'boots',
      'SvgColor': '#4d3326'
    }
  },

  // --- ACCESSORIES (UNISEX) ---
  {
    id: 301,
    title: 'Premium Wool Felt Fedora',
    description: 'A sophisticated structured fedora hat crafted from premium Australian wool felt. Detailed with a tonal grosgrain ribbon trim and internal sweatband. Offers vintage styling options for any seasonal look.',
    price: 75,
    discountPercentage: 0,
    rating: 4.6,
    stock: 12,
    brand: 'ZaraStyle',
    category: 'hat',
    thumbnail: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'hat',
      'Gender': 'unisex',
      'Color': '#2b2b2b', // Charcoal Gray
      'Material': '100% Australian Wool Felt',
      'Fabric': 'Structured felted wool, sweat-resistant',
      'Delivery': '3-5 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'accessory, classic, wool',
      'SvgStyle': 'fedora',
      'SvgColor': '#424242'
    }
  },
  {
    id: 302,
    title: 'Canvas Sport Baseball Cap',
    description: 'A casual six-panel baseball cap stitched in durable washed cotton canvas. Completed with an adjustable metal buckle tab, ventilation eyelets, and pre-curved brim. Ideal for athletic workouts or relaxed street styles.',
    price: 25,
    discountPercentage: 0,
    rating: 4.7,
    stock: 80,
    brand: 'NikeSports',
    category: 'hat',
    thumbnail: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'hat',
      'Gender': 'unisex',
      'Color': '#3b4252', // Dark Slate Blue
      'Material': '100% Washed Cotton Canvas',
      'Fabric': 'Soft unstructured canvas twill',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual',
      'StyleTags': 'accessory, athletic, everyday',
      'SvgStyle': 'cap',
      'SvgColor': '#4c566a'
    }
  },
  {
    id: 303,
    title: 'Retro Oval Acetate Sunglasses',
    description: 'Chic, vintage-inspired oval sunglasses sculpted in glossy organic acetate frames with dark 100% UV protective lenses. Elegant gold metal branding studs on the temples. Perfect retro styling for beach or city outings.',
    price: 49,
    discountPercentage: 10,
    rating: 4.8,
    stock: 40,
    brand: 'ZaraStyle',
    category: 'glasses',
    thumbnail: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'glasses',
      'Gender': 'unisex',
      'Color': '#111111', // Obsidian Gloss
      'Material': '100% Biodegradable Acetate Frames',
      'Fabric': 'Scratch-resistant CR-39 polar lenses',
      'Delivery': '2-3 Business Days',
      'Occasion': 'casual, seasonal',
      'StyleTags': 'accessory, retro, beach',
      'SvgStyle': 'sunglasses',
      'SvgColor': '#2b2b2b'
    }
  }
];

// Helper to filter fashion clothes
export const getFashionProducts = (): Product[] => {
  return fashionProducts;
};

export const getFashionProductById = (id: number): Product | undefined => {
  return fashionProducts.find((p) => p.id === id);
};
