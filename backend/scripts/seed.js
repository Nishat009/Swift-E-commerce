require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { assertSafeToSeed } = require('./safety');
const { ADMIN_EMAIL, CUSTOMER_EMAIL, seedPassword, randomPassword, passwordHint } = require('./seedConfig');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Coupon = require('../src/models/Coupon');
const Review = require('../src/models/Review');
const fashionProductsData = require('./fashionProductsData');
const fashionCategories = require('./fashionCategories');
const { deriveFilterSpecs } = require('./filterMetadata');

// SwiftCart is a fashion store: the seed uses the same catalog as seed:catalog and the live demo
const categoriesData = fashionCategories;
const curatedProducts = fashionProductsData;

const seed = async () => {
  try {
    const mongoUri = assertSafeToSeed('seed');
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
      email: ADMIN_EMAIL,
      password: seedPassword(),
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

    // Create 1 Test User (Demo user)
    usersToCreate.push({
      name: 'Test User',
      email: CUSTOMER_EMAIL,
      password: seedPassword(),
      phone: '+1 555 019 2831',
      role: 'customer',
      addresses: [
        {
          street: '456 Sample Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
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
        password: randomPassword(),
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
      Object.assign(specs, deriveFilterSpecs({ title: p.title, category: p.category, specifications: specs }));
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
    console.log(`Sign in as ${ADMIN_EMAIL} or ${CUSTOMER_EMAIL} with ${passwordHint()}.`);
  } catch (error) {
    console.error('Seeding Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seed();
