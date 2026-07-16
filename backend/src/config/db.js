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
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
