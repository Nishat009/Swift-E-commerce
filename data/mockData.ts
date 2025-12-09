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
    title: 'Modern Leather Sofa',
    description: 'Premium leather sofa with metal legs, perfect for contemporary living spaces. Comfortable seating for 3-4 people.',
    price: 1299,
    discountPercentage: 10,
    rating: 4.8,
    stock: 15,
    brand: 'FurniturePro',
    category: 'sofa',
    thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 2,
    title: 'Wooden Dining Chair Set',
    description: 'Set of 4 wooden dining chairs with elegant design and comfortable seating. Made from solid oak wood.',
    price: 599,
    discountPercentage: 12,
    rating: 4.7,
    stock: 20,
    brand: 'WoodCraft',
    category: 'chair',
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 3,
    title: 'Marble Coffee Table',
    description: 'Elegant marble coffee table with metal frame. Perfect centerpiece for any living room setup.',
    price: 449,
    discountPercentage: 8,
    rating: 4.9,
    stock: 25,
    brand: 'MarbleHome',
    category: 'table',
    thumbnail: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 4,
    title: 'Pendant Light Fixture',
    description: 'Modern pendant light with brass finish. Creates warm, ambient lighting perfect for kitchens and dining areas.',
    price: 199,
    discountPercentage: 15,
    rating: 4.6,
    stock: 40,
    brand: 'LightDesign',
    category: 'lighting',
    thumbnail: 'https://images.unsplash.com/photo-1565182999555-0c6684f5b6fa?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1565182999555-0c6684f5b6fa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1543198126-565f40db7507?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 5,
    title: 'Area Rug Wool',
    description: 'Premium wool area rug with geometric pattern. Adds warmth and texture to any room. Size: 8x10 ft.',
    price: 349,
    discountPercentage: 20,
    rating: 4.7,
    stock: 30,
    brand: 'RugDesign',
    category: 'decor',
    thumbnail: 'https://images.unsplash.com/photo-1552320554-5fefe8c9ef14?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1552320554-5fefe8c9ef14?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 6,
    title: 'Ceramic Decorative Vase',
    description: 'Handcrafted ceramic vase with natural glaze. Perfect for displaying flowers or as a standalone decoration.',
    price: 129,
    discountPercentage: 10,
    rating: 4.8,
    stock: 50,
    brand: 'ArtisanCraft',
    category: 'decor',
    thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 7,
    title: 'Wall Art Canvas',
    description: 'Abstract wall art printed on premium canvas. Ready to hang, adds modern elegance to any space.',
    price: 249,
    discountPercentage: 5,
    rating: 4.7,
    stock: 35,
    brand: 'ArtGallery',
    category: 'decor',
    thumbnail: 'https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 8,
    title: 'Wooden Bookshelf',
    description: 'Tall wooden bookshelf with 5 shelves. Combines functionality with minimalist design. Width: 30 inches.',
    price: 399,
    discountPercentage: 12,
    rating: 4.6,
    stock: 18,
    brand: 'WoodCraft',
    category: 'storage',
    thumbnail: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 9,
    title: 'Upholstered Armchair',
    description: 'Comfortable upholstered armchair with wooden legs. Perfect reading chair for bedroom or living room.',
    price: 549,
    discountPercentage: 15,
    rating: 4.8,
    stock: 22,
    brand: 'ComfortSeating',
    category: 'chair',
    thumbnail: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 10,
    title: 'Stainless Steel Kitchen Sink',
    description: 'Premium stainless steel under-mount sink. Durable, easy to clean, perfect for modern kitchens.',
    price: 299,
    discountPercentage: 8,
    rating: 4.7,
    stock: 28,
    brand: 'KitchenPro',
    category: 'kitchen',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 11,
    title: 'Bathroom Vanity Cabinet',
    description: 'Modern bathroom vanity with sink and mirror. Features soft-close drawers and plenty of storage space.',
    price: 699,
    discountPercentage: 10,
    rating: 4.9,
    stock: 12,
    brand: 'BathDesign',
    category: 'bathroom',
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1510595046332-4d336487f183?w=800&h=800&fit=crop',
    ],
  },
  {
    id: 12,
    title: 'Outdoor Patio Chair',
    description: 'Weather-resistant patio chair with cushion. Perfect for garden, terrace, or balcony seating.',
    price: 179,
    discountPercentage: 18,
    rating: 4.6,
    stock: 45,
    brand: 'OutdoorLiving',
    category: 'outdoor',
    thumbnail: 'https://images.unsplash.com/photo-1578922746466-caaae2541431?w=400&h=400&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1578922746466-caaae2541431?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=800&fit=crop',
    ],
  },
];

export const mockCategories = [
  'all',
  'sofa',
  'chair',
  'table',
  'lighting',
  'decor',
  'storage',
  'kitchen',
  'bathroom',
  'outdoor',
];

export const mockReviews: Record<number, Review[]> = {
  1: [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      rating: 5,
      comment: 'Beautiful sofa! The leather quality is excellent and it&apos;s very comfortable. Perfect for my living room.',
      date: '2024-01-15',
      verified: true,
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Sarah Smith',
      rating: 4,
      comment: 'Great sofa overall, very stylish. Delivery was quick and assembly was easy.',
      date: '2024-01-10',
      verified: true,
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Johnson',
      rating: 5,
      comment: 'Best purchase I&apos;ve made! The metal legs add a nice modern touch and it&apos;s super durable.',
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
      comment: 'Love these dining chairs! Solid oak wood, very sturdy and comfortable for long dinners.',
      date: '2024-01-12',
      verified: true,
    },
    {
      id: '5',
      userId: 'user5',
      userName: 'David Lee',
      rating: 4,
      comment: 'Great set of chairs. The design is elegant and they match perfectly with my dining table.',
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
      comment: 'The marble coffee table is stunning! It&apos;s the perfect centerpiece for my living room.',
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
      comment: 'Beautiful pendant light! Creates perfect ambiance in my kitchen. Great quality and design.',
      date: '2024-01-11',
      verified: true,
    },
    {
      id: '8',
      userId: 'user8',
      userName: 'Tom Wilson',
      rating: 4,
      comment: 'Nice light fixture. Easy to install and the brass finish looks premium.',
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



