import { Product } from '@/types';

export const fashionProducts: Product[] = [
  // =========================================================================
  // 1. TOPS & SHIRTS (6 PIECES)
  // =========================================================================
  {
    id: 501,
    title: 'Oversized Silk White Shirt',
    slug: 'oversized-silk-white-shirt',
    description: 'A luxurious oversized button-down shirt crafted in lightweight pure mulberry silk. Features a clean architectural collar, mother-of-pearl buttons, and relaxed dropped shoulders for effortless day-to-evening dressing.',
    shortDescription: 'Luxurious oversized shirt in pure mulberry silk.',
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
    images: [
      '/images/dress-room/white-silk-shirt-product.jpg',
      '/images/dress-room/white-silk-shirt-model.jpg'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#ffffff',
      'Material': '100% Mulberry Silk',
      'Fabric': 'Lustrous lightweight silk crepe',
      'Occasion': 'luxury, evening, editorial'
    },
    tags: ['New', 'Bestseller', 'Featured', 'minimalist', 'luxury'],
    variants: [
      {
        id: 'var-501-size',
        name: 'Size',
        options: [
          { id: 'opt-501-s', name: 'Size', value: 'S', stock: 12 },
          { id: 'opt-501-m', name: 'Size', value: 'M', stock: 15 },
          { id: 'opt-501-l', name: 'Size', value: 'L', stock: 8 },
        ]
      },
      {
        id: 'var-501-color',
        name: 'Color',
        options: [
          { id: 'opt-501-white', name: 'Color', value: 'Pure White', colorHex: '#ffffff', stock: 25 },
          { id: 'opt-501-champagne', name: 'Color', value: 'Champagne', colorHex: '#f5e6d3', stock: 10 },
        ]
      }
    ],
    reviewCount: 38,
    ratingDistribution: { 5: 32, 4: 5, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 502,
    title: 'Emerald Linen Camp Collar Shirt',
    slug: 'emerald-linen-camp-collar-shirt',
    description: "A tailored men's resort shirt tailored from premium breathable European flax linen in a rich emerald green shade. Finished with a relaxed camp collar and single chest welt pocket.",
    shortDescription: 'Tailored European flax linen camp collar shirt.',
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
    images: [
      '/images/dress-room/emerald-linen-shirt-product.jpg',
      '/images/dress-room/emerald-linen-shirt-model.jpg'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#0a5c36',
      'Material': '100% European Flax Linen',
      'Fabric': 'Textured breathable woven linen',
      'Occasion': 'resort, casual, summer'
    },
    tags: ['New', 'Featured', 'linen', 'resort'],
    variants: [
      {
        id: 'var-502-size',
        name: 'Size',
        options: [
          { id: 'opt-502-m', name: 'Size', value: 'M', stock: 12 },
          { id: 'opt-502-l', name: 'Size', value: 'L', stock: 10 },
          { id: 'opt-502-xl', name: 'Size', value: 'XL', stock: 6 },
        ]
      },
      {
        id: 'var-502-color',
        name: 'Color',
        options: [
          { id: 'opt-502-emerald', name: 'Color', value: 'Emerald Green', colorHex: '#0a5c36', stock: 18 },
          { id: 'opt-502-navy', name: 'Color', value: 'Midnight Navy', colorHex: '#0f172a', stock: 10 },
        ]
      }
    ],
    reviewCount: 24,
    ratingDistribution: { 5: 19, 4: 4, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 503,
    title: 'Chunky Cable Knit Cashmere Sweater',
    slug: 'chunky-cable-knit-cashmere-sweater',
    description: 'A decadent oversized knit sweater woven from 100% pure Mongolian cashmere in a rich oat-cream shade. Detailed with heritage rope cable motifs and ribbed trims.',
    shortDescription: 'Decadent oversized sweater in 100% pure Mongolian cashmere.',
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
    images: [
      '/images/dress-room/cashmere-knit-sweater-product.jpg',
      '/images/dress-room/cashmere-knit-sweater-model.jpg'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e6ded3',
      'Material': '100% Mongolian Cashmere',
      'Fabric': '7-gauge 4-ply chunky cable knit',
      'Occasion': 'cozy, autumn, winter luxury'
    },
    tags: ['New', 'Bestseller', 'Featured'],
    variants: [
      {
        id: 'var-503-size',
        name: 'Size',
        options: [
          { id: 'opt-503-s', name: 'Size', value: 'S', stock: 8 },
          { id: 'opt-503-m', name: 'Size', value: 'M', stock: 8 },
          { id: 'opt-503-l', name: 'Size', value: 'L', stock: 4 },
        ]
      },
      {
        id: 'var-503-color',
        name: 'Color',
        options: [
          { id: 'opt-503-oat', name: 'Color', value: 'Oatmeal Cream', colorHex: '#e6ded3', stock: 12 },
          { id: 'opt-503-charcoal', name: 'Color', value: 'Charcoal Grey', colorHex: '#333333', stock: 8 },
        ]
      }
    ],
    reviewCount: 31,
    ratingDistribution: { 5: 28, 4: 3, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 504,
    title: 'Relaxed Striped Poplin Shirt',
    slug: 'relaxed-striped-poplin-shirt',
    description: 'Crisp yarn-dyed navy striped cotton shirt with deep French cuffs, casually unbuttoned and tucked into high-waisted pleated linen trousers or paired with raw denim.',
    shortDescription: 'Yarn-dyed nautical stripe cotton poplin shirt.',
    price: 65,
    originalPrice: 80,
    discountPercentage: 18,
    rating: 4.8,
    stock: 45,
    brand: 'Swift Atelier',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'unisex',
      'Color': '#1e3a8a',
      'Material': '100% Egyptian Giza Cotton',
      'Fabric': 'High-density poplin weave',
      'Occasion': 'office, casual, smart casual'
    },
    tags: ['Bestseller', 'Featured'],
    variants: [
      {
        id: 'var-504-size',
        name: 'Size',
        options: [
          { id: 'opt-504-s', name: 'Size', value: 'S', stock: 15 },
          { id: 'opt-504-m', name: 'Size', value: 'M', stock: 18 },
          { id: 'opt-504-l', name: 'Size', value: 'L', stock: 12 },
        ]
      }
    ],
    reviewCount: 19,
    ratingDistribution: { 5: 16, 4: 3, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 505,
    title: 'Cropped Sculptural Knit Tank',
    slug: 'cropped-sculptural-knit-tank',
    description: 'A premium cropped tank top knitted in soft, ribbed organic cotton. Features a sleek scoop neck and flatlock seams for ultimate comfort and clean architectural lines.',
    shortDescription: 'Organic cotton ribbed crop tank with scoop neck.',
    price: 42,
    originalPrice: 50,
    discountPercentage: 16,
    rating: 4.7,
    stock: 50,
    brand: 'Swift Atelier',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e3dac9',
      'Material': '95% Organic Cotton, 5% Elastane',
      'Fabric': 'Ribbed stretch knit, lightweight',
      'Occasion': 'casual, layering, summer'
    },
    tags: ['New', 'Minimalist'],
    variants: [
      {
        id: 'var-505-color',
        name: 'Color',
        options: [
          { id: 'opt-505-cream', name: 'Color', value: 'Alabaster Cream', colorHex: '#e3dac9', stock: 25 },
          { id: 'opt-505-black', name: 'Color', value: 'Obsidian Black', colorHex: '#18181b', stock: 25 },
        ]
      }
    ],
    reviewCount: 22,
    ratingDistribution: { 5: 18, 4: 3, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 506,
    title: 'Heavyweight Graphic Oversized Hoodie',
    slug: 'heavyweight-graphic-oversized-hoodie',
    description: 'A 450gsm heavyweight brushed fleece hoodie featuring a double-lined hood, dropped shoulders, and subtle minimalist tonal embroidery at the chest.',
    shortDescription: '450gsm heavyweight fleece hoodie with dropped shoulders.',
    price: 95,
    originalPrice: 120,
    discountPercentage: 20,
    rating: 4.9,
    stock: 35,
    brand: 'Swift Streetwear',
    category: 'top',
    thumbnail: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'top',
      'Gender': 'unisex',
      'Color': '#27272a',
      'Material': '100% Organic Heavy Cotton',
      'Fabric': '450gsm brushed back loopback fleece',
      'Occasion': 'streetwear, casual, winter'
    },
    tags: ['New', 'Streetwear', 'Bestseller'],
    variants: [
      {
        id: 'var-506-size',
        name: 'Size',
        options: [
          { id: 'opt-506-m', name: 'Size', value: 'M', stock: 15 },
          { id: 'opt-506-l', name: 'Size', value: 'L', stock: 15 },
          { id: 'opt-506-xl', name: 'Size', value: 'XL', stock: 5 },
        ]
      }
    ],
    reviewCount: 41,
    ratingDistribution: { 5: 36, 4: 4, 3: 1, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 2. DRESSES & GOWNS (6 PIECES)
  // =========================================================================
  {
    id: 507,
    title: 'Floral Silk Slip Evening Dress',
    slug: 'floral-silk-slip-evening-dress',
    description: 'An ethereal midi-length slip evening dress rendered in fluid deep burgundy silk jacquard with delicate tonal floral motifs. Designed with a draped cowl neckline and side leg slit.',
    shortDescription: 'Ethereal burgundy silk jacquard slip evening dress.',
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
    images: [
      '/images/dress-room/floral-silk-dress-product.jpg',
      '/images/dress-room/floral-silk-dress-model.jpg'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#58111a',
      'Material': '100% Silk Charmeuse',
      'Fabric': 'High-drape silk jacquard',
      'Occasion': 'evening, gala, cocktail'
    },
    tags: ['New', 'Bestseller', 'Featured'],
    variants: [
      {
        id: 'var-507-size',
        name: 'Size',
        options: [
          { id: 'opt-507-xs', name: 'Size', value: 'XS', stock: 6 },
          { id: 'opt-507-s', name: 'Size', value: 'S', stock: 10 },
          { id: 'opt-507-m', name: 'Size', value: 'M', stock: 6 },
        ]
      }
    ],
    reviewCount: 29,
    ratingDistribution: { 5: 26, 4: 3, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 508,
    title: 'Minimalist Noir Bodycon Midi Dress',
    slug: 'minimalist-noir-bodycon-midi-dress',
    description: 'A sculptural black ribbed-knit midi dress with a square neckline and body-skimming silhouette. Engineered in compact stretch viscose for comfortable all-day hold.',
    shortDescription: 'Sculptural black ribbed-knit midi dress.',
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
    images: [
      '/images/dress-room/noir-bodycon-dress-product.jpg',
      '/images/dress-room/noir-bodycon-dress-model.jpg'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#111111',
      'Material': '80% Viscose, 20% Polyamide',
      'Fabric': 'Compact vertical ribbed knit',
      'Occasion': 'contemporary, minimalist, evening'
    },
    tags: ['New', 'Featured', 'minimalist'],
    variants: [
      {
        id: 'var-508-size',
        name: 'Size',
        options: [
          { id: 'opt-508-s', name: 'Size', value: 'S', stock: 12 },
          { id: 'opt-508-m', name: 'Size', value: 'M', stock: 12 },
          { id: 'opt-508-l', name: 'Size', value: 'L', stock: 6 },
        ]
      }
    ],
    reviewCount: 35,
    ratingDistribution: { 5: 30, 4: 4, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 509,
    title: 'Draped Emerald Satin Gown',
    slug: 'draped-emerald-satin-gown',
    description: 'A showstopping floor-sweeping gown in liquid emerald satin with asymmetric pleating across the bodice, a high side-slit, and an open cross-back design.',
    shortDescription: 'Liquid emerald satin floor-sweeping gown.',
    price: 260,
    originalPrice: 320,
    discountPercentage: 18,
    rating: 5.0,
    stock: 14,
    brand: 'Swift Atelier',
    category: 'dress',
    thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#064e3b',
      'Material': '100% Silk Satin',
      'Fabric': 'High-gloss heavy liquid satin',
      'Occasion': 'red carpet, gala, black tie'
    },
    tags: ['Luxury', 'Featured', 'Bestseller'],
    variants: [
      {
        id: 'var-509-size',
        name: 'Size',
        options: [
          { id: 'opt-509-s', name: 'Size', value: 'S', stock: 6 },
          { id: 'opt-509-m', name: 'Size', value: 'M', stock: 8 },
        ]
      }
    ],
    reviewCount: 17,
    ratingDistribution: { 5: 17, 4: 0, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 510,
    title: 'Tiered Linen Summer Maxi Dress',
    slug: 'tiered-linen-summer-maxi-dress',
    description: 'An airy, romantic maxi dress cut from sun-washed pure linen in warm terracotta. Detailed with ruffled tiered hem, smocked back, and dainty tie-up straps.',
    shortDescription: 'Sun-washed terracotta pure linen tiered maxi dress.',
    price: 110,
    originalPrice: 135,
    discountPercentage: 18,
    rating: 4.8,
    stock: 25,
    brand: 'Swift Atelier',
    category: 'dress',
    thumbnail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#c2410c',
      'Material': '100% French Flax Linen',
      'Fabric': 'Garment-washed breathable linen',
      'Occasion': 'vacation, resort, summer brunch'
    },
    tags: ['New', 'Summer', 'Featured'],
    variants: [
      {
        id: 'var-510-size',
        name: 'Size',
        options: [
          { id: 'opt-510-s', name: 'Size', value: 'S', stock: 10 },
          { id: 'opt-510-m', name: 'Size', value: 'M', stock: 15 },
        ]
      }
    ],
    reviewCount: 21,
    ratingDistribution: { 5: 18, 4: 3, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 511,
    title: 'Champagne Silk Cowl Cocktail Dress',
    slug: 'champagne-silk-cowl-cocktail-dress',
    description: 'A bias-cut mini cocktail dress in glowing champagne silk with delicate spaghetti straps and a draped low cowl neckline.',
    shortDescription: 'Glowing champagne silk bias-cut cocktail dress.',
    price: 145,
    originalPrice: 175,
    discountPercentage: 17,
    rating: 4.9,
    stock: 20,
    brand: 'Swift Atelier',
    category: 'dress',
    thumbnail: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#fef08a',
      'Material': '100% Silk Charmeuse',
      'Fabric': 'Lustrous bias-cut silk',
      'Occasion': 'cocktail, party, birthday'
    },
    tags: ['New', 'Bestseller'],
    variants: [
      {
        id: 'var-511-size',
        name: 'Size',
        options: [
          { id: 'opt-511-xs', name: 'Size', value: 'XS', stock: 8 },
          { id: 'opt-511-s', name: 'Size', value: 'S', stock: 12 },
        ]
      }
    ],
    reviewCount: 26,
    ratingDistribution: { 5: 23, 4: 3, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 512,
    title: 'Pleated Velvet Corset Midi Dress',
    slug: 'pleated-velvet-corset-midi-dress',
    description: 'An opulent royal midnight blue velvet midi dress featuring an internal boned corset bodice and fine sunray knife-pleated skirt.',
    shortDescription: 'Royal blue velvet midi dress with corset bodice.',
    price: 195,
    originalPrice: 240,
    discountPercentage: 18,
    rating: 4.9,
    stock: 16,
    brand: 'Swift Atelier',
    category: 'dress',
    thumbnail: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#1e1b4b',
      'Material': '90% Silk Velvet, 10% Elastane',
      'Fabric': 'Plush high-pile stretch silk velvet',
      'Occasion': 'holiday, winter gala, opera'
    },
    tags: ['Luxury', 'Featured'],
    variants: [
      {
        id: 'var-512-size',
        name: 'Size',
        options: [
          { id: 'opt-512-s', name: 'Size', value: 'S', stock: 8 },
          { id: 'opt-512-m', name: 'Size', value: 'M', stock: 8 },
        ]
      }
    ],
    reviewCount: 15,
    ratingDistribution: { 5: 14, 4: 1, 3: 0, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 3. OUTERWEAR & JACKETS (5 PIECES)
  // =========================================================================
  {
    id: 513,
    title: 'Tailored Camel Wool Trench Coat',
    slug: 'tailored-camel-wool-trench-coat',
    description: 'A double-breasted outerwear masterpiece crafted in double-faced Italian camel virgin wool. Features epaulets, storm flaps, and a matching belt with buckle.',
    shortDescription: 'Double-faced Italian camel virgin wool trench coat.',
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
    images: [
      '/images/dress-room/camel-wool-trench-product.jpg',
      '/images/dress-room/camel-wool-trench-model.jpg'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#c19a6b',
      'Material': '100% Virgin Wool',
      'Fabric': 'Double-faced Italian melton wool',
      'Occasion': 'autumn, winter, luxury'
    },
    tags: ['New', 'Bestseller', 'Featured'],
    variants: [
      {
        id: 'var-513-size',
        name: 'Size',
        options: [
          { id: 'opt-513-s', name: 'Size', value: 'S', stock: 6 },
          { id: 'opt-513-m', name: 'Size', value: 'M', stock: 8 },
          { id: 'opt-513-l', name: 'Size', value: 'L', stock: 4 },
        ]
      }
    ],
    reviewCount: 44,
    ratingDistribution: { 5: 42, 4: 2, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 514,
    title: 'Vintage Distressed Denim Trucker Jacket',
    slug: 'vintage-distressed-denim-trucker-jacket',
    description: 'An authentic heavy-duty 14oz rigid cotton denim trucker jacket in an authentic vintage stonewash finish with antique brass buttons and chest flap pockets.',
    shortDescription: '14oz rigid cotton vintage stonewash denim trucker.',
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
    images: [
      '/images/dress-room/denim-trucker-jacket-product.jpg',
      '/images/dress-room/denim-trucker-jacket-model.jpg'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#466d8c',
      'Material': '100% Organic Cotton Denim',
      'Fabric': '14oz rigid selvedge denim',
      'Occasion': 'streetwear, casual, heritage'
    },
    tags: ['New', 'Streetwear'],
    variants: [
      {
        id: 'var-514-size',
        name: 'Size',
        options: [
          { id: 'opt-514-m', name: 'Size', value: 'M', stock: 20 },
          { id: 'opt-514-l', name: 'Size', value: 'L', stock: 20 },
        ]
      }
    ],
    reviewCount: 28,
    ratingDistribution: { 5: 22, 4: 5, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 515,
    title: 'Asymmetric Black Leather Biker Jacket',
    slug: 'asymmetric-black-leather-biker-jacket',
    description: 'Handcrafted in buttery full-grain lambskin leather with heavy-gauge silver metal hardware, asymmetrical front zip, notched lapels, and adjustable waist buckles.',
    shortDescription: 'Handcrafted full-grain lambskin biker jacket.',
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
    images: [
      '/images/dress-room/black-leather-biker-product.jpg',
      '/images/dress-room/black-leather-biker-model.jpg'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#0d0d0d',
      'Material': '100% Full-Grain Lambskin Leather',
      'Fabric': 'Plonge lambskin, silky satin lining',
      'Occasion': 'edgy, streetwear, night out'
    },
    tags: ['New', 'Featured', 'Leather'],
    variants: [
      {
        id: 'var-515-size',
        name: 'Size',
        options: [
          { id: 'opt-515-s', name: 'Size', value: 'S', stock: 7 },
          { id: 'opt-515-m', name: 'Size', value: 'M', stock: 8 },
        ]
      }
    ],
    reviewCount: 37,
    ratingDistribution: { 5: 34, 4: 3, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 516,
    title: 'Oversized Wool Blend Blazer',
    slug: 'oversized-wool-blend-blazer',
    description: 'An architectural double-breasted blazer with sharp padded shoulders, horn buttons, and a relaxed boxy fit that pairs effortlessly with trousers or over a slip dress.',
    shortDescription: 'Architectural double-breasted wool blend blazer.',
    price: 180,
    originalPrice: 220,
    discountPercentage: 18,
    rating: 4.8,
    stock: 22,
    brand: 'Swift Atelier',
    category: 'jacket',
    thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'unisex',
      'Color': '#3f3f46',
      'Material': '60% Wool, 40% Viscose',
      'Fabric': 'Structured twill suiting',
      'Occasion': 'office, modern tailoring, formal'
    },
    tags: ['Bestseller', 'Tailoring'],
    variants: [
      {
        id: 'var-516-size',
        name: 'Size',
        options: [
          { id: 'opt-516-s', name: 'Size', value: 'S', stock: 10 },
          { id: 'opt-516-m', name: 'Size', value: 'M', stock: 12 },
        ]
      }
    ],
    reviewCount: 30,
    ratingDistribution: { 5: 25, 4: 5, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 517,
    title: 'Matte Down-Filled Puffer Jacket',
    slug: 'matte-down-filled-puffer-jacket',
    description: 'An ultra-warm winter puffer coat filled with certified 700-fill white goose down. Finished with water-repellent matte outer shell and high thermal funnel collar.',
    shortDescription: '700-fill white goose down matte puffer coat.',
    price: 210,
    originalPrice: 260,
    discountPercentage: 19,
    rating: 4.9,
    stock: 24,
    brand: 'Swift Streetwear',
    category: 'jacket',
    thumbnail: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'unisex',
      'Color': '#09090b',
      'Material': '100% Recycled Nylon, 90% Down, 10% Feathers',
      'Fabric': 'Matte micro-ripstop waterproof shell',
      'Occasion': 'winter, streetwear, outdoor'
    },
    tags: ['Winter', 'Featured'],
    variants: [
      {
        id: 'var-517-size',
        name: 'Size',
        options: [
          { id: 'opt-517-m', name: 'Size', value: 'M', stock: 12 },
          { id: 'opt-517-l', name: 'Size', value: 'L', stock: 12 },
        ]
      }
    ],
    reviewCount: 22,
    ratingDistribution: { 5: 20, 4: 2, 3: 0, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 4. PANTS & DENIM (5 PIECES)
  // =========================================================================
  {
    id: 518,
    title: 'High-Rise Pleated Wide-Leg Trousers',
    slug: 'high-rise-pleated-wide-leg-trousers',
    description: 'Sculptural high-waisted wide-leg trousers in a tailored cream twill weave. Features deep front pleats, pressed center creases, and slant side pockets for a clean silhouette.',
    shortDescription: 'Tailored cream twill high-rise pleated wide-leg trousers.',
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
    images: [
      '/images/dress-room/cream-wide-trousers-product.jpg',
      '/images/dress-room/cream-wide-trousers-model.jpg'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#ece6da',
      'Material': '70% Wool, 30% Silk Twill',
      'Fabric': 'High-density drape twill',
      'Occasion': 'quiet luxury, professional, formal'
    },
    tags: ['New', 'Bestseller'],
    variants: [
      {
        id: 'var-518-size',
        name: 'Size',
        options: [
          { id: 'opt-518-s', name: 'Size', value: 'S', stock: 10 },
          { id: 'opt-518-m', name: 'Size', value: 'M', stock: 15 },
        ]
      }
    ],
    reviewCount: 33,
    ratingDistribution: { 5: 28, 4: 5, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 519,
    title: 'Relaxed Raw Indigo Denim Jeans',
    slug: 'relaxed-raw-indigo-denim-jeans',
    description: 'Crafted from unwashed raw Japanese selvedge denim in deep indigo blue. Cut in a modern relaxed straight-leg fit designed to develop unique personal fade patterns.',
    shortDescription: 'Unwashed raw Japanese selvedge denim straight-leg jeans.',
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
    images: [
      '/images/dress-room/raw-indigo-jeans-product.jpg',
      '/images/dress-room/raw-indigo-jeans-model.jpg'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'unisex',
      'Color': '#1a233a',
      'Material': '100% Japanese Selvedge Cotton',
      'Fabric': '13.5oz raw rigid denim',
      'Occasion': 'casual, streetwear, everyday'
    },
    tags: ['New', 'Denim'],
    variants: [
      {
        id: 'var-519-size',
        name: 'Size',
        options: [
          { id: 'opt-519-30', name: 'Size', value: '30W', stock: 12 },
          { id: 'opt-519-32', name: 'Size', value: '32W', stock: 12 },
          { id: 'opt-519-34', name: 'Size', value: '34W', stock: 8 },
        ]
      }
    ],
    reviewCount: 27,
    ratingDistribution: { 5: 21, 4: 5, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 520,
    title: 'Tailored Caramel Chinos',
    slug: 'tailored-caramel-chinos',
    description: 'A versatile flat-front chino trouser made from exceptionally soft cotton-twill stretch fabric in rich caramel tone with double-welt pockets.',
    shortDescription: 'Soft cotton-twill stretch chinos in rich caramel.',
    price: 69,
    originalPrice: 85,
    discountPercentage: 18,
    rating: 4.8,
    stock: 30,
    brand: 'Swift Atelier',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'male',
      'Color': '#b45309',
      'Material': '98% Cotton Twill, 2% Elastane',
      'Fabric': 'Peach-finish comfort stretch twill',
      'Occasion': 'smart casual, workwear, weekend'
    },
    tags: ['Bestseller'],
    variants: [
      {
        id: 'var-520-size',
        name: 'Size',
        options: [
          { id: 'opt-520-30', name: 'Size', value: '30W', stock: 10 },
          { id: 'opt-520-32', name: 'Size', value: '32W', stock: 12 },
          { id: 'opt-520-34', name: 'Size', value: '34W', stock: 8 },
        ]
      }
    ],
    reviewCount: 20,
    ratingDistribution: { 5: 16, 4: 4, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 521,
    title: 'Straight-Leg Rigid White Denim',
    slug: 'straight-leg-rigid-white-denim',
    description: 'High-waisted crisp white rigid denim jeans tailored with classic 5-pocket styling, silver hardware, and clean ankle cuffs.',
    shortDescription: 'High-waisted pure white rigid cotton denim jeans.',
    price: 85,
    originalPrice: 105,
    discountPercentage: 19,
    rating: 4.7,
    stock: 28,
    brand: 'Swift Denim Co.',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#fafafa',
      'Material': '100% Organic Heavy Cotton',
      'Fabric': '13oz crisp optical white denim',
      'Occasion': 'monochrome, summer, resort'
    },
    tags: ['New', 'Minimalist'],
    variants: [
      {
        id: 'var-521-size',
        name: 'Size',
        options: [
          { id: 'opt-521-26', name: 'Size', value: '26W', stock: 8 },
          { id: 'opt-521-28', name: 'Size', value: '28W', stock: 12 },
          { id: 'opt-521-30', name: 'Size', value: '30W', stock: 8 },
        ]
      }
    ],
    reviewCount: 16,
    ratingDistribution: { 5: 13, 4: 2, 3: 1, 2: 0, 1: 0 }
  },
  {
    id: 522,
    title: 'Tactical Multi-Pocket Cargo Trousers',
    slug: 'tactical-multi-pocket-cargo-trousers',
    description: 'Rugged cargo pants crafted in heavy cotton ripstop fabric with adjustable bungee ankle toggles and modular tactical bellow pockets.',
    shortDescription: 'Heavy cotton ripstop cargo trousers with bungee cuffs.',
    price: 92,
    originalPrice: 115,
    discountPercentage: 20,
    rating: 4.8,
    stock: 35,
    brand: 'Swift Streetwear',
    category: 'pants',
    thumbnail: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'pants',
      'Gender': 'unisex',
      'Color': '#27272a',
      'Material': '100% Ripstop Cotton',
      'Fabric': 'High-tensile abrasion resistant weave',
      'Occasion': 'streetwear, utilitarian, techwear'
    },
    tags: ['Streetwear', 'New'],
    variants: [
      {
        id: 'var-522-size',
        name: 'Size',
        options: [
          { id: 'opt-522-m', name: 'Size', value: 'M', stock: 15 },
          { id: 'opt-522-l', name: 'Size', value: 'L', stock: 15 },
          { id: 'opt-522-xl', name: 'Size', value: 'XL', stock: 5 },
        ]
      }
    ],
    reviewCount: 23,
    ratingDistribution: { 5: 19, 4: 3, 3: 1, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 5. FOOTWEAR & SHOES (3 PIECES)
  // =========================================================================
  {
    id: 523,
    title: 'Classic Leather Chelsea Boots',
    slug: 'classic-leather-chelsea-boots',
    description: 'A refined pair of pull-on Chelsea boots built in hand-finished full-grain leather with flexible elastic side gusset and Goodyear welted sole.',
    shortDescription: 'Hand-finished full-grain leather Chelsea boots.',
    price: 160,
    originalPrice: 195,
    discountPercentage: 18,
    rating: 4.9,
    stock: 22,
    brand: 'Swift Atelier',
    category: 'shoes',
    thumbnail: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'unisex',
      'Color': '#451a03',
      'Material': '100% Full-Grain Calfskin Leather',
      'Fabric': 'Burnished leather upper with stacked heel',
      'Occasion': 'formal, smart casual, autumn'
    },
    tags: ['Bestseller', 'Featured'],
    variants: [
      {
        id: 'var-523-size',
        name: 'Size',
        options: [
          { id: 'opt-523-40', name: 'Size', value: 'EU 40', stock: 6 },
          { id: 'opt-523-42', name: 'Size', value: 'EU 42', stock: 10 },
          { id: 'opt-523-44', name: 'Size', value: 'EU 44', stock: 6 },
        ]
      }
    ],
    reviewCount: 34,
    ratingDistribution: { 5: 30, 4: 4, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 524,
    title: 'Minimalist Platform Air Sneakers',
    slug: 'minimalist-platform-air-sneakers',
    description: 'Clean architectural leather sneakers with breathable technical mesh lining and a cushioned lightweight platform sole.',
    shortDescription: 'Architectural white leather platform air sneakers.',
    price: 120,
    originalPrice: 145,
    discountPercentage: 17,
    rating: 4.8,
    stock: 35,
    brand: 'Swift Streetwear',
    category: 'shoes',
    thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'unisex',
      'Color': '#ffffff',
      'Material': '100% Nappa Leather & Rubber',
      'Fabric': 'Smooth matte leather with EVA shock sole',
      'Occasion': 'daily, streetwear, athletic'
    },
    tags: ['New', 'Bestseller'],
    variants: [
      {
        id: 'var-524-size',
        name: 'Size',
        options: [
          { id: 'opt-524-38', name: 'Size', value: 'EU 38', stock: 10 },
          { id: 'opt-524-40', name: 'Size', value: 'EU 40', stock: 15 },
          { id: 'opt-524-42', name: 'Size', value: 'EU 42', stock: 10 },
        ]
      }
    ],
    reviewCount: 40,
    ratingDistribution: { 5: 35, 4: 5, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 525,
    title: 'Strappy Stiletto Heeled Sandals',
    slug: 'strappy-stiletto-heeled-sandals',
    description: 'Delicate open-toe stiletto heels crafted in gold metallic leather with crisscross ankle straps and cushioned leather footbeds.',
    shortDescription: 'Gold metallic leather strappy stiletto evening sandals.',
    price: 135,
    originalPrice: 165,
    discountPercentage: 18,
    rating: 4.9,
    stock: 18,
    brand: 'Swift Atelier',
    category: 'shoes',
    thumbnail: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'female',
      'Color': '#eab308',
      'Material': 'Metallic Finish Lambskin',
      'Fabric': '90mm stiletto heel, leather sole',
      'Occasion': 'party, wedding, gala'
    },
    tags: ['Luxury', 'New'],
    variants: [
      {
        id: 'var-525-size',
        name: 'Size',
        options: [
          { id: 'opt-525-37', name: 'Size', value: 'EU 37', stock: 8 },
          { id: 'opt-525-38', name: 'Size', value: 'EU 38', stock: 10 },
        ]
      }
    ],
    reviewCount: 19,
    ratingDistribution: { 5: 17, 4: 2, 3: 0, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 6. BAGS & LEATHER (2 PIECES)
  // =========================================================================
  {
    id: 526,
    title: 'Minimalist Italian Leather Shoulder Bag',
    slug: 'minimalist-italian-leather-shoulder-bag',
    description: 'A structural shoulder bag crafted in smooth, full-grain Italian leather. Features a curved silhouette, thin adjustable strap, zip closure, and interior patch pockets.',
    shortDescription: 'Full-grain Italian leather curved shoulder bag.',
    price: 150,
    originalPrice: 180,
    discountPercentage: 16,
    rating: 4.8,
    stock: 20,
    brand: 'Swift Atelier',
    category: 'bag',
    thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'bag',
      'Gender': 'female',
      'Color': '#18181b',
      'Material': '100% Italian Nappa Leather, Cotton Lining',
      'Fabric': 'Smooth leather finish with custom grain detailing',
      'Occasion': 'casual, office, party'
    },
    tags: ['Bestseller', 'Featured'],
    variants: [
      {
        id: 'var-526-color',
        name: 'Color',
        options: [
          { id: 'opt-526-black', name: 'Color', value: 'Noir Black', colorHex: '#18181b', stock: 12 },
          { id: 'opt-526-tan', name: 'Color', value: 'Saddle Tan', colorHex: '#9a3412', stock: 8 },
        ]
      }
    ],
    reviewCount: 31,
    ratingDistribution: { 5: 26, 4: 5, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 527,
    title: 'Architectural Canvas & Leather Tote',
    slug: 'architectural-canvas-leather-tote',
    description: 'An oversized geometric tote bag in heavy structured ecru cotton canvas framed with cognac bridle leather trims and magnetic tab closure.',
    shortDescription: 'Heavy structured ecru canvas tote with cognac leather.',
    price: 130,
    originalPrice: 160,
    discountPercentage: 18,
    rating: 4.9,
    stock: 22,
    brand: 'Swift Atelier',
    category: 'bag',
    thumbnail: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'bag',
      'Gender': 'unisex',
      'Color': '#f5f5f4',
      'Material': '100% Heavy Cotton Canvas & Bridle Leather',
      'Fabric': 'Water-resistant 20oz duck canvas',
      'Occasion': 'travel, workwear, weekend'
    },
    tags: ['New', 'Featured'],
    variants: [
      {
        id: 'var-527-color',
        name: 'Color',
        options: [
          { id: 'opt-527-canvas', name: 'Color', value: 'Ecru / Cognac', colorHex: '#f5f5f4', stock: 22 },
        ]
      }
    ],
    reviewCount: 18,
    ratingDistribution: { 5: 16, 4: 2, 3: 0, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 7. JEWELRY & ACCESSORIES (2 PIECES)
  // =========================================================================
  {
    id: 528,
    title: '14k Gold Chain & Chunky Hoops Set',
    slug: '14k-gold-chain-chunky-hoops-set',
    description: 'A curated jewelry set featuring a 14k gold-plated herringbone choker chain and matching hollow chunky round hoop earrings with hypoallergenic surgical steel posts.',
    shortDescription: '14k gold-plated herringbone chain and chunky hoop earrings.',
    price: 55,
    originalPrice: 70,
    discountPercentage: 21,
    rating: 4.9,
    stock: 50,
    brand: 'Swift Atelier',
    category: 'jewelry',
    thumbnail: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jewelry',
      'Gender': 'female',
      'Color': '#ffd700',
      'Material': '14k Gold-Plated Recycled Brass',
      'Fabric': 'High-shine anti-tarnish e-coating',
      'Occasion': 'party, office, wedding, everyday'
    },
    tags: ['Bestseller', 'Gold'],
    variants: [
      {
        id: 'var-528-color',
        name: 'Color',
        options: [
          { id: 'opt-528-gold', name: 'Color', value: '14k Yellow Gold', colorHex: '#ffd700', stock: 35 },
          { id: 'opt-528-silver', name: 'Color', value: 'Rhodium Silver', colorHex: '#e2e8f0', stock: 15 },
        ]
      }
    ],
    reviewCount: 46,
    ratingDistribution: { 5: 42, 4: 4, 3: 0, 2: 0, 1: 0 }
  },
  {
    id: 529,
    title: 'Vintage Chronograph Leather Watch',
    slug: 'vintage-chronograph-leather-watch',
    description: 'A classic 40mm stainless steel chronograph watch with domed sapphire crystal, champagne dial, and interchangeable vegetable-tanned Italian leather strap.',
    shortDescription: '40mm stainless steel chronograph with sapphire crystal.',
    price: 185,
    originalPrice: 230,
    discountPercentage: 20,
    rating: 5.0,
    stock: 15,
    brand: 'Swift Atelier',
    category: 'jewelry',
    thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'jewelry',
      'Gender': 'unisex',
      'Color': '#d97706',
      'Material': '316L Stainless Steel & Italian Calfskin',
      'Fabric': '5 ATM Water Resistant, Japanese Mecha-Quartz',
      'Occasion': 'formal, business, gifting'
    },
    tags: ['Luxury', 'Featured'],
    variants: [
      {
        id: 'var-529-strap',
        name: 'Color',
        options: [
          { id: 'opt-529-cognac', name: 'Color', value: 'Cognac Brown', colorHex: '#9a3412', stock: 8 },
          { id: 'opt-529-black', name: 'Color', value: 'Jet Black', colorHex: '#18181b', stock: 7 },
        ]
      }
    ],
    reviewCount: 25,
    ratingDistribution: { 5: 25, 4: 0, 3: 0, 2: 0, 1: 0 }
  },

  // =========================================================================
  // 8. HATS & EYEWEAR (2 PIECES)
  // =========================================================================
  {
    id: 530,
    title: 'Premium Australian Wool Felt Fedora',
    slug: 'premium-australian-wool-felt-fedora',
    description: 'A structured wide-brim fedora hat crafted from 100% Australian wool felt with a tonal grosgrain ribbon band and internal moisture-wicking sweatband.',
    shortDescription: '100% Australian wool felt wide-brim fedora hat.',
    price: 75,
    originalPrice: 90,
    discountPercentage: 16,
    rating: 4.8,
    stock: 20,
    brand: 'Swift Atelier',
    category: 'hat',
    thumbnail: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    specifications: {
      'Layer': 'hat',
      'Gender': 'unisex',
      'Color': '#27272a',
      'Material': '100% Australian Wool Felt',
      'Fabric': 'Structured water-resistant felted wool',
      'Occasion': 'autumn, winter, outdoor, festival'
    },
    tags: ['New', 'Accessory'],
    variants: [
      {
        id: 'var-530-color',
        name: 'Color',
        options: [
          { id: 'opt-530-charcoal', name: 'Color', value: 'Charcoal', colorHex: '#27272a', stock: 12 },
          { id: 'opt-530-camel', name: 'Color', value: 'Camel Tan', colorHex: '#c19a6b', stock: 8 },
        ]
      }
    ],
    reviewCount: 22,
    ratingDistribution: { 5: 18, 4: 4, 3: 0, 2: 0, 1: 0 }
  }
];

// Helper to filter fashion clothes
export const getFashionProducts = (): Product[] => {
  return fashionProducts;
};

export const getFashionProductById = (id: number): Product | undefined => {
  return fashionProducts.find((p) => Number(p.id) === Number(id));
};
