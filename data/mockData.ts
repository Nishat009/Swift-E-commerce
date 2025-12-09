import { Product } from '@/types';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    title: 'iPhone 15 Pro Max',
    description: 'The most advanced iPhone ever with A17 Pro chip, titanium design, and Pro camera system.',
    price: 1199,
    discountPercentage: 5,
    rating: 4.8,
    stock: 50,
    brand: 'Apple',
    category: 'smartphones',
    thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 2,
    title: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android flagship with S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor.',
    price: 1299,
    discountPercentage: 8,
    rating: 4.7,
    stock: 35,
    brand: 'Samsung',
    category: 'smartphones',
    thumbnail: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 3,
    title: 'MacBook Pro 16" M3 Max',
    description: 'Powerful laptop for professionals with M3 Max chip, Liquid Retina XDR display, and up to 22-hour battery.',
    price: 3999,
    discountPercentage: 3,
    rating: 4.9,
    stock: 20,
    brand: 'Apple',
    category: 'laptops',
    thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 4,
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with 30-hour battery life and premium sound quality.',
    price: 399,
    discountPercentage: 10,
    rating: 4.6,
    stock: 75,
    brand: 'Sony',
    category: 'audio',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 5,
    title: 'Nike Air Max 270',
    description: 'Comfortable running shoes with Air Max cushioning and breathable mesh upper.',
    price: 150,
    discountPercentage: 15,
    rating: 4.5,
    stock: 100,
    brand: 'Nike',
    category: 'shoes',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c7ffd?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c7ffd?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 6,
    title: 'Canon EOS R5 Camera',
    description: 'Professional mirrorless camera with 45MP sensor, 8K video, and advanced autofocus.',
    price: 3899,
    discountPercentage: 7,
    rating: 4.8,
    stock: 15,
    brand: 'Canon',
    category: 'cameras',
    thumbnail: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 7,
    title: 'Samsung 55" QLED 4K TV',
    description: 'Stunning 4K QLED display with Quantum HDR, Smart TV features, and voice control.',
    price: 899,
    discountPercentage: 12,
    rating: 4.7,
    stock: 30,
    brand: 'Samsung',
    category: 'televisions',
    thumbnail: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 8,
    title: 'Apple Watch Series 9',
    description: 'Advanced smartwatch with S9 chip, Always-On Retina display, and health monitoring.',
    price: 399,
    discountPercentage: 5,
    rating: 4.6,
    stock: 60,
    brand: 'Apple',
    category: 'wearables',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 9,
    title: 'Dell XPS 15 Laptop',
    description: 'Premium 15-inch laptop with Intel Core i9, 32GB RAM, and 4K OLED display.',
    price: 2499,
    discountPercentage: 8,
    rating: 4.7,
    stock: 25,
    brand: 'Dell',
    category: 'laptops',
    thumbnail: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 10,
    title: 'AirPods Pro (2nd Gen)',
    description: 'Active Noise Cancellation, Spatial Audio, and Adaptive Transparency mode.',
    price: 249,
    discountPercentage: 10,
    rating: 4.8,
    stock: 80,
    brand: 'Apple',
    category: 'audio',
    thumbnail: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 11,
    title: 'PlayStation 5 Console',
    description: 'Next-gen gaming console with ray tracing, 4K gaming, and ultra-fast SSD.',
    price: 499,
    discountPercentage: 0,
    rating: 4.9,
    stock: 12,
    brand: 'Sony',
    category: 'gaming',
    thumbnail: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 12,
    title: 'Dyson V15 Detect Vacuum',
    description: 'Cordless vacuum with laser detection, HEPA filtration, and 60-minute runtime.',
    price: 749,
    discountPercentage: 15,
    rating: 4.6,
    stock: 40,
    brand: 'Dyson',
    category: 'home',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=800&fit=crop',
    ],
  },
];

export const mockCategories = [
  'all',
  'smartphones',
  'laptops',
  'audio',
  'shoes',
  'cameras',
  'televisions',
  'wearables',
  'gaming',
  'home',
];

export const mockReviews: Record<number, Review[]> = {
  1: [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      rating: 5,
      comment: 'Amazing phone! The camera quality is outstanding and the battery lasts all day. Highly recommend!',
      date: '2024-01-15',
      verified: true,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah Smith',
      rating: 4,
      comment: 'Great phone overall, but a bit expensive. The performance is excellent though.',
      date: '2024-01-10',
      verified: true,
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Johnson',
      rating: 5,
      comment: 'Best iPhone I\'ve ever owned. The titanium build feels premium and the display is gorgeous.',
      date: '2024-01-08',
      verified: false,
    },
  ],
  2: [
    {
      id: '4',
      userId: 'user4',
      userName: 'Emily Chen',
      rating: 5,
      comment: 'Love the S Pen feature! Perfect for taking notes and drawing. Camera is incredible too.',
      date: '2024-01-12',
      verified: true,
    },
    {
      id: '5',
      userId: 'user5',
      userName: 'David Lee',
      rating: 4,
      comment: 'Excellent Android phone. Fast, smooth, and the display is beautiful. Battery could be better.',
      date: '2024-01-05',
      verified: true,
    },
  ],
  3: [
    {
      id: '6',
      userId: 'user6',
      userName: 'Alex Brown',
      rating: 5,
      comment: 'Perfect for video editing and development. The M3 Max chip is incredibly powerful.',
      date: '2024-01-14',
      verified: true,
    },
  ],
  4: [
    {
      id: '7',
      userId: 'user7',
      userName: 'Lisa Wang',
      rating: 5,
      comment: 'Best noise cancellation I\'ve ever experienced. Perfect for travel and work.',
      date: '2024-01-11',
      verified: true,
    },
    {
      id: '8',
      userId: 'user8',
      userName: 'Tom Wilson',
      rating: 4,
      comment: 'Great sound quality and comfortable to wear for hours. Battery life is impressive.',
      date: '2024-01-09',
      verified: false,
    },
  ],
};

// Helper function to get products by category
export const getProductsByCategory = (category: string): Product[] => {
  if (category === 'all') return mockProducts;
  return mockProducts.filter((p) => p.category === category);
};

// Helper function to search products
export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery)
  );
};

// Helper function to get product by ID
export const getProductById = (id: number): Product | undefined => {
  return mockProducts.find((p) => p.id === id);
};

// Helper function to get related products
export const getRelatedProducts = (productId: number, limit: number = 4): Product[] => {
  const product = getProductById(productId);
  if (!product) return [];
  
  return mockProducts
    .filter((p) => p.id !== productId && p.category === product.category)
    .slice(0, limit);
};

// Helper function to get reviews for a product
export const getProductReviews = (productId: number): Review[] => {
  return mockReviews[productId] || [];
};



