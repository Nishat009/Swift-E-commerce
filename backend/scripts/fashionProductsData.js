/**
 * 30 Curated AI & 3D Dressing Room Fashion Products with Paired Product & Model Images
 */
const fashionProductsData = [
  // =========================================================================
  // 1. TOPS & SHIRTS (6 PIECES)
  // =========================================================================
  {
    title: 'Oversized Silk White Shirt',
    slug: 'oversized-silk-white-shirt',
    description: 'A luxurious oversized button-down shirt crafted in lightweight pure mulberry silk. Features a clean architectural collar, mother-of-pearl buttons, and relaxed dropped shoulders for effortless day-to-evening dressing.',
    shortDescription: 'Luxurious oversized shirt in pure mulberry silk.',
    category: 'top',
    brand: 'Swift Atelier',
    price: 125,
    salePrice: 125,
    originalPrice: 145,
    discountPercentage: 14,
    stock: 35,
    rating: 4.9,
    featured: true,
    thumbnail: '/images/dress-room/white-silk-shirt-product.jpg',
    productImage: '/images/dress-room/white-silk-shirt-product.jpg',
    modelWearingImage: '/images/dress-room/white-silk-shirt-model.jpg',
    images: [
      '/images/dress-room/white-silk-shirt-product.jpg',
      '/images/dress-room/white-silk-shirt-model.jpg'
    ],
    tags: ['New', 'Bestseller', 'Featured', 'minimalist', 'luxury'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#ffffff',
      'Material': '100% Mulberry Silk',
      'Fabric': 'Lustrous lightweight silk crepe',
      'Occasion': 'luxury, evening, editorial'
    }
  },
  {
    title: 'Emerald Linen Camp Collar Shirt',
    slug: 'emerald-linen-camp-collar-shirt',
    description: "A tailored men's resort shirt tailored from premium breathable European flax linen in a rich emerald green shade. Finished with a relaxed camp collar and single chest welt pocket.",
    shortDescription: 'Tailored European flax linen camp collar shirt.',
    category: 'top',
    brand: 'Swift Atelier',
    price: 89,
    salePrice: 89,
    originalPrice: 110,
    discountPercentage: 19,
    stock: 28,
    rating: 4.8,
    featured: true,
    thumbnail: '/images/dress-room/emerald-linen-shirt-product.jpg',
    productImage: '/images/dress-room/emerald-linen-shirt-product.jpg',
    modelWearingImage: '/images/dress-room/emerald-linen-shirt-model.jpg',
    images: [
      '/images/dress-room/emerald-linen-shirt-product.jpg',
      '/images/dress-room/emerald-linen-shirt-model.jpg'
    ],
    tags: ['New', 'Featured', 'linen', 'resort'],
    specifications: {
      'Layer': 'top',
      'Gender': 'male',
      'Color': '#0a5c36',
      'Material': '100% European Flax Linen',
      'Fabric': 'Textured breathable woven linen',
      'Occasion': 'resort, casual, summer'
    }
  },
  {
    title: 'Chunky Cable Knit Cashmere Sweater',
    slug: 'chunky-cable-knit-cashmere-sweater',
    description: 'A decadent oversized knit sweater woven from 100% pure Mongolian cashmere in a rich oat-cream shade. Detailed with heritage rope cable motifs and ribbed trims.',
    shortDescription: 'Decadent oversized sweater in 100% pure Mongolian cashmere.',
    category: 'top',
    brand: 'Swift Atelier',
    price: 175,
    salePrice: 175,
    originalPrice: 210,
    discountPercentage: 16,
    stock: 20,
    rating: 4.9,
    featured: true,
    thumbnail: '/images/dress-room/cashmere-knit-sweater-product.jpg',
    productImage: '/images/dress-room/cashmere-knit-sweater-product.jpg',
    modelWearingImage: '/images/dress-room/cashmere-knit-sweater-model.jpg',
    images: [
      '/images/dress-room/cashmere-knit-sweater-product.jpg',
      '/images/dress-room/cashmere-knit-sweater-model.jpg'
    ],
    tags: ['New', 'Bestseller', 'Featured', 'cashmere'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e6ded3',
      'Material': '100% Mongolian Cashmere',
      'Fabric': '7-gauge 4-ply chunky cable knit',
      'Occasion': 'cozy, autumn, winter luxury'
    }
  },
  {
    title: 'Relaxed Striped Poplin Shirt',
    slug: 'relaxed-striped-poplin-shirt',
    description: 'Crisp yarn-dyed navy striped cotton shirt with deep French cuffs, casually unbuttoned and tucked into high-waisted pleated linen trousers or paired with raw denim.',
    shortDescription: 'Yarn-dyed nautical stripe cotton poplin shirt.',
    category: 'top',
    brand: 'Swift Atelier',
    price: 65,
    salePrice: 65,
    originalPrice: 80,
    discountPercentage: 18,
    stock: 45,
    rating: 4.8,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    tags: ['Bestseller', 'Featured', 'stripes'],
    specifications: {
      'Layer': 'top',
      'Gender': 'unisex',
      'Color': '#1e3a8a',
      'Material': '100% Egyptian Giza Cotton',
      'Fabric': 'High-density poplin weave',
      'Occasion': 'office, casual, smart casual'
    }
  },
  {
    title: 'Cropped Sculptural Knit Tank',
    slug: 'cropped-sculptural-knit-tank',
    description: 'A premium cropped tank top knitted in soft, ribbed organic cotton. Features a sleek scoop neck and flatlock seams for ultimate comfort and clean architectural lines.',
    shortDescription: 'Organic cotton ribbed crop tank with scoop neck.',
    category: 'top',
    brand: 'Swift Atelier',
    price: 42,
    salePrice: 42,
    originalPrice: 50,
    discountPercentage: 16,
    stock: 50,
    rating: 4.7,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Minimalist', 'summer'],
    specifications: {
      'Layer': 'top',
      'Gender': 'female',
      'Color': '#e3dac9',
      'Material': '95% Organic Cotton, 5% Elastane',
      'Fabric': 'Ribbed stretch knit, lightweight',
      'Occasion': 'casual, layering, summer'
    }
  },
  {
    title: 'Heavyweight Graphic Oversized Hoodie',
    slug: 'heavyweight-graphic-oversized-hoodie',
    description: 'A 450gsm heavyweight brushed fleece hoodie featuring a double-lined hood, dropped shoulders, and subtle minimalist tonal embroidery at the chest.',
    shortDescription: '450gsm heavyweight fleece hoodie with dropped shoulders.',
    category: 'top',
    brand: 'Swift Streetwear',
    price: 95,
    salePrice: 95,
    originalPrice: 120,
    discountPercentage: 20,
    stock: 35,
    rating: 4.9,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Streetwear', 'Bestseller'],
    specifications: {
      'Layer': 'top',
      'Gender': 'unisex',
      'Color': '#27272a',
      'Material': '100% Organic Heavy Cotton',
      'Fabric': '450gsm brushed back loopback fleece',
      'Occasion': 'streetwear, casual, winter'
    }
  },

  // =========================================================================
  // 2. DRESSES & GOWNS (6 PIECES)
  // =========================================================================
  {
    title: 'Floral Silk Slip Evening Dress',
    slug: 'floral-silk-slip-evening-dress',
    description: 'An ethereal midi-length slip evening dress rendered in fluid deep burgundy silk jacquard with delicate tonal floral motifs. Designed with a draped cowl neckline and side leg slit.',
    shortDescription: 'Ethereal burgundy silk jacquard slip evening dress.',
    category: 'dress',
    brand: 'Swift Atelier',
    price: 185,
    salePrice: 185,
    originalPrice: 220,
    discountPercentage: 16,
    stock: 22,
    rating: 4.9,
    featured: true,
    thumbnail: '/images/dress-room/floral-silk-dress-product.jpg',
    productImage: '/images/dress-room/floral-silk-dress-product.jpg',
    modelWearingImage: '/images/dress-room/floral-silk-dress-model.jpg',
    images: [
      '/images/dress-room/floral-silk-dress-product.jpg',
      '/images/dress-room/floral-silk-dress-model.jpg'
    ],
    tags: ['New', 'Bestseller', 'Featured', 'evening'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#58111a',
      'Material': '100% Silk Charmeuse',
      'Fabric': 'High-drape silk jacquard',
      'Occasion': 'evening, gala, cocktail'
    }
  },
  {
    title: 'Minimalist Noir Bodycon Midi Dress',
    slug: 'minimalist-noir-bodycon-midi-dress',
    description: 'A sculptural black ribbed-knit midi dress with a square neckline and body-skimming silhouette. Engineered in compact stretch viscose for comfortable all-day hold.',
    shortDescription: 'Sculptural black ribbed-knit bodycon midi dress.',
    category: 'dress',
    brand: 'Swift Atelier',
    price: 135,
    salePrice: 135,
    originalPrice: 160,
    discountPercentage: 15,
    stock: 30,
    rating: 4.8,
    featured: true,
    thumbnail: '/images/dress-room/noir-bodycon-dress-product.jpg',
    productImage: '/images/dress-room/noir-bodycon-dress-product.jpg',
    modelWearingImage: '/images/dress-room/noir-bodycon-dress-model.jpg',
    images: [
      '/images/dress-room/noir-bodycon-dress-product.jpg',
      '/images/dress-room/noir-bodycon-dress-model.jpg'
    ],
    tags: ['New', 'Featured', 'minimalist', 'black'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#111111',
      'Material': '80% Viscose, 20% Polyamide',
      'Fabric': 'Compact vertical ribbed knit',
      'Occasion': 'contemporary, minimalist, evening'
    }
  },
  {
    title: 'Draped Emerald Satin Gown',
    slug: 'draped-emerald-satin-gown',
    description: 'A showstopping floor-sweeping gown in liquid emerald satin with asymmetric pleating across the bodice, a high side-slit, and an open cross-back design.',
    shortDescription: 'Liquid emerald satin floor-sweeping gown.',
    category: 'dress',
    brand: 'Swift Atelier',
    price: 260,
    salePrice: 260,
    originalPrice: 320,
    discountPercentage: 18,
    stock: 14,
    rating: 5.0,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop'
    ],
    tags: ['Luxury', 'Featured', 'Bestseller'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#064e3b',
      'Material': '100% Silk Satin',
      'Fabric': 'High-gloss heavy liquid satin',
      'Occasion': 'red carpet, gala, black tie'
    }
  },
  {
    title: 'Tiered Linen Summer Maxi Dress',
    slug: 'tiered-linen-summer-maxi-dress',
    description: 'An airy, romantic maxi dress cut from sun-washed pure linen in warm terracotta. Detailed with ruffled tiered hem, smocked back, and dainty tie-up straps.',
    shortDescription: 'Sun-washed terracotta pure linen tiered maxi dress.',
    category: 'dress',
    brand: 'Swift Atelier',
    price: 110,
    salePrice: 110,
    originalPrice: 135,
    discountPercentage: 18,
    stock: 25,
    rating: 4.8,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Summer', 'Featured'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#c2410c',
      'Material': '100% French Flax Linen',
      'Fabric': 'Garment-washed breathable linen',
      'Occasion': 'vacation, resort, summer brunch'
    }
  },
  {
    title: 'Champagne Silk Cowl Cocktail Dress',
    slug: 'champagne-silk-cowl-cocktail-dress',
    description: 'A bias-cut mini cocktail dress in glowing champagne silk with delicate spaghetti straps and a draped low cowl neckline.',
    shortDescription: 'Glowing champagne silk bias-cut cocktail dress.',
    category: 'dress',
    brand: 'Swift Atelier',
    price: 145,
    salePrice: 145,
    originalPrice: 175,
    discountPercentage: 17,
    stock: 20,
    rating: 4.9,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Bestseller', 'cocktail'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#fef08a',
      'Material': '100% Silk Charmeuse',
      'Fabric': 'Lustrous bias-cut silk',
      'Occasion': 'cocktail, party, birthday'
    }
  },
  {
    title: 'Pleated Velvet Corset Midi Dress',
    slug: 'pleated-velvet-corset-midi-dress',
    description: 'An opulent royal midnight blue velvet midi dress featuring an internal boned corset bodice and fine sunray knife-pleated skirt.',
    shortDescription: 'Royal blue velvet midi dress with corset bodice.',
    category: 'dress',
    brand: 'Swift Atelier',
    price: 195,
    salePrice: 195,
    originalPrice: 240,
    discountPercentage: 18,
    stock: 16,
    rating: 4.9,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1200&fit=crop'
    ],
    tags: ['Luxury', 'Featured', 'velvet'],
    specifications: {
      'Layer': 'dress',
      'Gender': 'female',
      'Color': '#1e1b4b',
      'Material': '90% Silk Velvet, 10% Elastane',
      'Fabric': 'Plush high-pile stretch silk velvet',
      'Occasion': 'holiday, winter gala, opera'
    }
  },

  // =========================================================================
  // 3. OUTERWEAR & JACKETS (5 PIECES)
  // =========================================================================
  {
    title: 'Tailored Camel Wool Trench Coat',
    slug: 'tailored-camel-wool-trench-coat',
    description: 'A double-breasted outerwear masterpiece crafted in double-faced Italian camel virgin wool. Features epaulets, storm flaps, and a matching belt with buckle.',
    shortDescription: 'Double-breasted Italian camel virgin wool trench coat.',
    category: 'jacket',
    brand: 'Swift Atelier',
    price: 295,
    salePrice: 295,
    originalPrice: 350,
    discountPercentage: 15,
    stock: 18,
    rating: 5.0,
    featured: true,
    thumbnail: '/images/dress-room/camel-wool-trench-product.jpg',
    productImage: '/images/dress-room/camel-wool-trench-product.jpg',
    modelWearingImage: '/images/dress-room/camel-wool-trench-model.jpg',
    images: [
      '/images/dress-room/camel-wool-trench-product.jpg',
      '/images/dress-room/camel-wool-trench-model.jpg'
    ],
    tags: ['New', 'Bestseller', 'Featured', 'luxury', 'outerwear'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#c19a6b',
      'Material': '100% Virgin Wool',
      'Fabric': 'Double-faced Italian melton wool',
      'Occasion': 'autumn, winter, luxury'
    }
  },
  {
    title: 'Vintage Distressed Denim Trucker Jacket',
    slug: 'vintage-distressed-denim-trucker-jacket',
    description: 'An authentic heavy-duty 14oz rigid cotton denim trucker jacket in an authentic vintage stonewash finish with antique brass buttons and chest flap pockets.',
    shortDescription: '14oz rigid selvedge cotton denim trucker jacket.',
    category: 'jacket',
    brand: 'Swift Denim Co.',
    price: 119,
    salePrice: 119,
    originalPrice: 140,
    discountPercentage: 15,
    stock: 40,
    rating: 4.7,
    featured: false,
    thumbnail: '/images/dress-room/denim-trucker-jacket-product.jpg',
    productImage: '/images/dress-room/denim-trucker-jacket-product.jpg',
    modelWearingImage: '/images/dress-room/denim-trucker-jacket-model.jpg',
    images: [
      '/images/dress-room/denim-trucker-jacket-product.jpg',
      '/images/dress-room/denim-trucker-jacket-model.jpg'
    ],
    tags: ['New', 'streetwear', 'denim'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'male',
      'Color': '#466d8c',
      'Material': '100% Organic Cotton Denim',
      'Fabric': '14oz rigid selvedge denim',
      'Occasion': 'streetwear, casual, heritage'
    }
  },
  {
    title: 'Asymmetric Black Leather Biker Jacket',
    slug: 'asymmetric-black-leather-biker-jacket',
    description: 'Handcrafted in buttery full-grain lambskin leather with heavy-gauge silver metal hardware, asymmetrical front zip, notched lapels, and adjustable waist buckles.',
    shortDescription: 'Buttery full-grain lambskin moto biker jacket.',
    category: 'jacket',
    brand: 'Swift Atelier',
    price: 340,
    salePrice: 340,
    originalPrice: 420,
    discountPercentage: 19,
    stock: 15,
    rating: 4.9,
    featured: true,
    thumbnail: '/images/dress-room/black-leather-biker-product.jpg',
    productImage: '/images/dress-room/black-leather-biker-product.jpg',
    modelWearingImage: '/images/dress-room/black-leather-biker-model.jpg',
    images: [
      '/images/dress-room/black-leather-biker-product.jpg',
      '/images/dress-room/black-leather-biker-model.jpg'
    ],
    tags: ['New', 'Featured', 'leather', 'edgy'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'female',
      'Color': '#0d0d0d',
      'Material': '100% Full-Grain Lambskin Leather',
      'Fabric': 'Plonge lambskin, silky satin lining',
      'Occasion': 'edgy, streetwear, night out'
    }
  },
  {
    title: 'Oversized Wool Blend Blazer',
    slug: 'oversized-wool-blend-blazer',
    description: 'An architectural double-breasted blazer with sharp padded shoulders, horn buttons, and a relaxed boxy fit that pairs effortlessly with trousers or over a slip dress.',
    shortDescription: 'Architectural double-breasted wool blend blazer.',
    category: 'jacket',
    brand: 'Swift Atelier',
    price: 180,
    salePrice: 180,
    originalPrice: 220,
    discountPercentage: 18,
    stock: 22,
    rating: 4.8,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    tags: ['Bestseller', 'Tailoring', 'blazer'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'unisex',
      'Color': '#3f3f46',
      'Material': '60% Wool, 40% Viscose',
      'Fabric': 'Structured twill suiting',
      'Occasion': 'office, modern tailoring, formal'
    }
  },
  {
    title: 'Matte Down-Filled Puffer Jacket',
    slug: 'matte-down-filled-puffer-jacket',
    description: 'An ultra-warm winter puffer coat filled with certified 700-fill white goose down. Finished with water-repellent matte outer shell and high thermal funnel collar.',
    shortDescription: '700-fill white goose down matte puffer coat.',
    category: 'jacket',
    brand: 'Swift Streetwear',
    price: 210,
    salePrice: 210,
    originalPrice: 260,
    discountPercentage: 19,
    stock: 24,
    rating: 4.9,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop'
    ],
    tags: ['Winter', 'Featured', 'puffer'],
    specifications: {
      'Layer': 'jacket',
      'Gender': 'unisex',
      'Color': '#09090b',
      'Material': '100% Recycled Nylon, 90% Down, 10% Feathers',
      'Fabric': 'Matte micro-ripstop waterproof shell',
      'Occasion': 'winter, streetwear, outdoor'
    }
  },

  // =========================================================================
  // 4. PANTS & DENIM (5 PIECES)
  // =========================================================================
  {
    title: 'High-Rise Pleated Wide-Leg Trousers',
    slug: 'high-rise-pleated-wide-leg-trousers',
    description: 'Sculptural high-waisted wide-leg trousers in a tailored cream twill weave. Features deep front pleats, pressed center creases, and slant side pockets for a clean silhouette.',
    shortDescription: 'Tailored cream twill high-rise pleated wide-leg trousers.',
    category: 'pants',
    brand: 'Swift Atelier',
    price: 115,
    salePrice: 115,
    originalPrice: 135,
    discountPercentage: 14,
    stock: 25,
    rating: 4.8,
    featured: false,
    thumbnail: '/images/dress-room/cream-wide-trousers-product.jpg',
    productImage: '/images/dress-room/cream-wide-trousers-product.jpg',
    modelWearingImage: '/images/dress-room/cream-wide-trousers-model.jpg',
    images: [
      '/images/dress-room/cream-wide-trousers-product.jpg',
      '/images/dress-room/cream-wide-trousers-model.jpg'
    ],
    tags: ['New', 'Bestseller', 'quiet-luxury', 'tailored'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#ece6da',
      'Material': '70% Wool, 30% Silk Twill',
      'Fabric': 'High-density drape twill',
      'Occasion': 'quiet luxury, professional, formal'
    }
  },
  {
    title: 'Relaxed Raw Indigo Denim Jeans',
    slug: 'relaxed-raw-indigo-denim-jeans',
    description: 'Crafted from unwashed raw Japanese selvedge denim in deep indigo blue. Cut in a modern relaxed straight-leg fit designed to develop unique personal fade patterns.',
    shortDescription: 'Japanese selvedge raw rigid indigo denim jeans.',
    category: 'pants',
    brand: 'Swift Denim Co.',
    price: 98,
    salePrice: 98,
    originalPrice: 120,
    discountPercentage: 18,
    stock: 32,
    rating: 4.7,
    featured: false,
    thumbnail: '/images/dress-room/raw-indigo-jeans-product.jpg',
    productImage: '/images/dress-room/raw-indigo-jeans-product.jpg',
    modelWearingImage: '/images/dress-room/raw-indigo-jeans-model.jpg',
    images: [
      '/images/dress-room/raw-indigo-jeans-product.jpg',
      '/images/dress-room/raw-indigo-jeans-model.jpg'
    ],
    tags: ['New', 'denim', 'selvedge'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'unisex',
      'Color': '#1a233a',
      'Material': '100% Japanese Selvedge Cotton',
      'Fabric': '13.5oz raw rigid denim',
      'Occasion': 'casual, streetwear, everyday'
    }
  },
  {
    title: 'Tailored Caramel Chinos',
    slug: 'tailored-caramel-chinos',
    description: 'A versatile flat-front chino trouser made from exceptionally soft cotton-twill stretch fabric in rich caramel tone with double-welt pockets.',
    shortDescription: 'Soft cotton-twill stretch chinos in rich caramel.',
    category: 'pants',
    brand: 'Swift Atelier',
    price: 69,
    salePrice: 69,
    originalPrice: 85,
    discountPercentage: 18,
    stock: 30,
    rating: 4.8,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop'
    ],
    tags: ['Bestseller', 'chinos', 'casual'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'male',
      'Color': '#b45309',
      'Material': '98% Cotton Twill, 2% Elastane',
      'Fabric': 'Peach-finish comfort stretch twill',
      'Occasion': 'smart casual, workwear, weekend'
    }
  },
  {
    title: 'Straight-Leg Rigid White Denim',
    slug: 'straight-leg-rigid-white-denim',
    description: 'High-waisted crisp white rigid denim jeans tailored with classic 5-pocket styling, silver hardware, and clean ankle cuffs.',
    shortDescription: 'High-waisted pure white rigid cotton denim jeans.',
    category: 'pants',
    brand: 'Swift Denim Co.',
    price: 85,
    salePrice: 85,
    originalPrice: 105,
    discountPercentage: 19,
    stock: 28,
    rating: 4.7,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Minimalist', 'white-denim'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'female',
      'Color': '#fafafa',
      'Material': '100% Organic Heavy Cotton',
      'Fabric': '13oz crisp optical white denim',
      'Occasion': 'monochrome, summer, resort'
    }
  },
  {
    title: 'Tactical Multi-Pocket Cargo Trousers',
    slug: 'tactical-multi-pocket-cargo-trousers',
    description: 'Rugged cargo pants crafted in heavy cotton ripstop fabric with adjustable bungee ankle toggles and modular tactical bellow pockets.',
    shortDescription: 'Heavy cotton ripstop cargo trousers with bungee cuffs.',
    category: 'pants',
    brand: 'Swift Streetwear',
    price: 92,
    salePrice: 92,
    originalPrice: 115,
    discountPercentage: 20,
    stock: 35,
    rating: 4.8,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&h=1200&fit=crop'
    ],
    tags: ['Streetwear', 'New', 'cargo'],
    specifications: {
      'Layer': 'pants',
      'Gender': 'unisex',
      'Color': '#27272a',
      'Material': '100% Ripstop Cotton',
      'Fabric': 'High-tensile abrasion resistant weave',
      'Occasion': 'streetwear, utilitarian, techwear'
    }
  },

  // =========================================================================
  // 5. FOOTWEAR & SHOES (3 PIECES)
  // =========================================================================
  {
    title: 'Classic Leather Chelsea Boots',
    slug: 'classic-leather-chelsea-boots',
    description: 'A refined pair of pull-on Chelsea boots built in hand-finished full-grain leather with flexible elastic side gusset and Goodyear welted sole.',
    shortDescription: 'Hand-finished full-grain leather Chelsea boots.',
    category: 'shoes',
    brand: 'Swift Atelier',
    price: 160,
    salePrice: 160,
    originalPrice: 195,
    discountPercentage: 18,
    stock: 22,
    rating: 4.9,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    tags: ['Bestseller', 'Featured', 'boots'],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'unisex',
      'Color': '#451a03',
      'Material': '100% Full-Grain Calfskin Leather',
      'Fabric': 'Burnished leather upper with stacked heel',
      'Occasion': 'formal, smart casual, autumn'
    }
  },
  {
    title: 'Minimalist Platform Air Sneakers',
    slug: 'minimalist-platform-air-sneakers',
    description: 'Clean architectural leather sneakers with breathable technical mesh lining and a cushioned lightweight platform sole.',
    shortDescription: 'Architectural white leather platform air sneakers.',
    category: 'shoes',
    brand: 'Swift Streetwear',
    price: 120,
    salePrice: 120,
    originalPrice: 145,
    discountPercentage: 17,
    stock: 35,
    rating: 4.8,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Bestseller', 'sneakers'],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'unisex',
      'Color': '#ffffff',
      'Material': '100% Nappa Leather & Rubber',
      'Fabric': 'Smooth matte leather with EVA shock sole',
      'Occasion': 'daily, streetwear, athletic'
    }
  },
  {
    title: 'Strappy Stiletto Heeled Sandals',
    slug: 'strappy-stiletto-heeled-sandals',
    description: 'Delicate open-toe stiletto heels crafted in gold metallic leather with crisscross ankle straps and cushioned leather footbeds.',
    shortDescription: 'Gold metallic leather strappy stiletto evening sandals.',
    category: 'shoes',
    brand: 'Swift Atelier',
    price: 135,
    salePrice: 135,
    originalPrice: 165,
    discountPercentage: 18,
    stock: 18,
    rating: 4.9,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1200&fit=crop'
    ],
    tags: ['Luxury', 'New', 'heels'],
    specifications: {
      'Layer': 'shoes',
      'Gender': 'female',
      'Color': '#eab308',
      'Material': 'Metallic Finish Lambskin',
      'Fabric': '90mm stiletto heel, leather sole',
      'Occasion': 'party, wedding, gala'
    }
  },

  // =========================================================================
  // 6. BAGS & LEATHER (2 PIECES)
  // =========================================================================
  {
    title: 'Minimalist Italian Leather Shoulder Bag',
    slug: 'minimalist-italian-leather-shoulder-bag',
    description: 'A structural shoulder bag crafted in smooth, full-grain Italian leather. Features a curved silhouette, thin adjustable strap, zip closure, and interior patch pockets.',
    shortDescription: 'Full-grain Italian leather curved shoulder bag.',
    category: 'bag',
    brand: 'Swift Atelier',
    price: 150,
    salePrice: 150,
    originalPrice: 180,
    discountPercentage: 16,
    stock: 20,
    rating: 4.8,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    tags: ['Bestseller', 'Featured', 'bag', 'leather'],
    specifications: {
      'Layer': 'bag',
      'Gender': 'female',
      'Color': '#18181b',
      'Material': '100% Italian Nappa Leather, Cotton Lining',
      'Fabric': 'Smooth leather finish with custom grain detailing',
      'Occasion': 'casual, office, party'
    }
  },
  {
    title: 'Architectural Canvas & Leather Tote',
    slug: 'architectural-canvas-leather-tote',
    description: 'An oversized geometric tote bag in heavy structured ecru cotton canvas framed with cognac bridle leather trims and magnetic tab closure.',
    shortDescription: 'Heavy structured ecru canvas tote with cognac leather.',
    category: 'bag',
    brand: 'Swift Atelier',
    price: 130,
    salePrice: 130,
    originalPrice: 160,
    discountPercentage: 18,
    stock: 22,
    rating: 4.9,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Featured', 'tote'],
    specifications: {
      'Layer': 'bag',
      'Gender': 'unisex',
      'Color': '#f5f5f4',
      'Material': '100% Heavy Cotton Canvas & Bridle Leather',
      'Fabric': 'Water-resistant 20oz duck canvas',
      'Occasion': 'travel, workwear, weekend'
    }
  },

  // =========================================================================
  // 7. JEWELRY & ACCESSORIES (2 PIECES)
  // =========================================================================
  {
    title: '14k Gold Chain & Chunky Hoops Set',
    slug: '14k-gold-chain-chunky-hoops-set',
    description: 'A curated jewelry set featuring a 14k gold-plated herringbone choker chain and matching hollow chunky round hoop earrings with hypoallergenic surgical steel posts.',
    shortDescription: '14k gold-plated herringbone chain and chunky hoop earrings.',
    category: 'jewelry',
    brand: 'Swift Atelier',
    price: 55,
    salePrice: 55,
    originalPrice: 70,
    discountPercentage: 21,
    stock: 50,
    rating: 4.9,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=1200&fit=crop'
    ],
    tags: ['Bestseller', 'Gold', 'jewelry'],
    specifications: {
      'Layer': 'jewelry',
      'Gender': 'female',
      'Color': '#ffd700',
      'Material': '14k Gold-Plated Recycled Brass',
      'Fabric': 'High-shine anti-tarnish e-coating',
      'Occasion': 'party, office, wedding, everyday'
    }
  },
  {
    title: 'Vintage Chronograph Leather Watch',
    slug: 'vintage-chronograph-leather-watch',
    description: 'A classic 40mm stainless steel chronograph watch with domed sapphire crystal, champagne dial, and interchangeable vegetable-tanned Italian leather strap.',
    shortDescription: '40mm stainless steel chronograph with sapphire crystal.',
    category: 'jewelry',
    brand: 'Swift Atelier',
    price: 185,
    salePrice: 185,
    originalPrice: 230,
    discountPercentage: 20,
    stock: 15,
    rating: 5.0,
    featured: true,
    thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=1200&fit=crop'
    ],
    tags: ['Luxury', 'Featured', 'watch'],
    specifications: {
      'Layer': 'jewelry',
      'Gender': 'unisex',
      'Color': '#d97706',
      'Material': '316L Stainless Steel & Italian Calfskin',
      'Fabric': '5 ATM Water Resistant, Japanese Mecha-Quartz',
      'Occasion': 'formal, business, gifting'
    }
  },

  // =========================================================================
  // 8. HATS & EYEWEAR (2 PIECES)
  // =========================================================================
  {
    title: 'Premium Australian Wool Felt Fedora',
    slug: 'premium-australian-wool-felt-fedora',
    description: 'A structured wide-brim fedora hat crafted from 100% Australian wool felt with a tonal grosgrain ribbon band and internal moisture-wicking sweatband.',
    shortDescription: '100% Australian wool felt wide-brim fedora hat.',
    category: 'hat',
    brand: 'Swift Atelier',
    price: 75,
    salePrice: 75,
    originalPrice: 90,
    discountPercentage: 16,
    stock: 20,
    rating: 4.8,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Accessory', 'hat'],
    specifications: {
      'Layer': 'hat',
      'Gender': 'unisex',
      'Color': '#27272a',
      'Material': '100% Australian Wool Felt',
      'Fabric': 'Structured water-resistant felted wool',
      'Occasion': 'autumn, winter, outdoor, festival'
    }
  },
  {
    title: 'Retro Oval Acetate Sunglasses',
    slug: 'retro-oval-acetate-sunglasses',
    description: 'Chic, vintage-inspired oval sunglasses sculpted in glossy organic acetate frames with dark 100% UV protective lenses. Elegant gold metal branding studs on the temples.',
    shortDescription: 'Retro oval sunglasses with 100% UV protection lenses.',
    category: 'glasses',
    brand: 'Swift Atelier',
    price: 49,
    salePrice: 49,
    originalPrice: 65,
    discountPercentage: 24,
    stock: 40,
    rating: 4.8,
    featured: false,
    thumbnail: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1200&fit=crop',
    productImage: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1200&fit=crop',
    modelWearingImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=1200&fit=crop'
    ],
    tags: ['New', 'Accessory', 'sunglasses'],
    specifications: {
      'Layer': 'glasses',
      'Gender': 'unisex',
      'Color': '#111111',
      'Material': '100% Biodegradable Acetate Frames',
      'Fabric': 'Scratch-resistant CR-39 polar lenses',
      'Occasion': 'casual, seasonal, summer'
    }
  }
];

module.exports = fashionProductsData;
