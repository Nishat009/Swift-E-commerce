const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ensure fixed admin user exists
    const adminExists = await User.findOne({ email: 'admin@email.com' });
    if (!adminExists) {
      console.log('Seeding fixed administrator account (admin@email.com)...');
      await User.create({
        name: 'Master Admin',
        email: 'admin@email.com',
        password: '12345678',
        role: 'admin',
        phone: '+1 800 555 0199',
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
      console.log('Fixed administrator account created successfully.');
    }

    // Ensure fixed test user exists
    const testUserExists = await User.findOne({ email: 'user@email.com' });
    if (!testUserExists) {
      console.log('Seeding fixed test user account (user@email.com)...');
      await User.create({
        name: 'Test User',
        email: 'user@email.com',
        password: '12345678',
        role: 'customer',
        phone: '+1 555 019 2831',
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
      console.log('Fixed test user account created successfully.');
    }

    // Seed initial currencies if none exist
    const Currency = require('../models/Currency');
    const currencyCount = await Currency.countDocuments();
    if (currencyCount === 0) {
      console.log('Seeding initial currencies (USD, EUR, GBP, BDT)...');
      await Currency.insertMany([
        { code: 'USD', symbol: '$', rate: 1.0, isDefault: true },
        { code: 'EUR', symbol: '€', rate: 0.92, isDefault: false },
        { code: 'GBP', symbol: '£', rate: 0.78, isDefault: false },
        { code: 'BDT', symbol: '৳', rate: 118.0, isDefault: false },
      ]);
      console.log('Currencies seeded successfully.');
    }

    // Seed initial languages if none exist
    const Language = require('../models/Language');
    const languageCount = await Language.countDocuments();
    if (languageCount === 0) {
      console.log('Seeding initial languages (en, bn, es)...');
      await Language.insertMany([
        { code: 'en', name: 'English', flag: '🇬🇧', isDefault: true, isActive: true },
        { code: 'bn', name: 'Bangla', flag: '🇧🇩', isDefault: false, isActive: true },
        { code: 'es', name: 'Spanish', flag: '🇪🇸', isDefault: false, isActive: true },
      ]);
      console.log('Languages seeded successfully.');
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
