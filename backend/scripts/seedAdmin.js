require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    let adminUser = await User.findOne({ email: 'admin@email.com' });

    if (adminUser) {
      console.log('Admin account found. Updating role & password...');
      adminUser.name = 'Master Admin';
      adminUser.role = 'admin';
      adminUser.password = '12345678';
      adminUser.twoFactorEnabled = false;
      await adminUser.save();
      console.log('Successfully updated existing user admin@email.com to Admin role with password "12345678".');
    } else {
      console.log('Creating fixed admin account admin@email.com...');
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
      console.log('Successfully created admin account admin@email.com with password "12345678".');
    }

    let testUser = await User.findOne({ email: 'user@email.com' });

    if (testUser) {
      console.log('Test user account found. Updating password...');
      testUser.name = 'Test User';
      testUser.role = 'customer';
      testUser.password = '12345678';
      testUser.twoFactorEnabled = false;
      await testUser.save();
      console.log('Successfully updated existing test user user@email.com with password "12345678".');
    } else {
      console.log('Creating fixed test user account user@email.com...');
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
      console.log('Successfully created test user account user@email.com with password "12345678".');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seedAdmin();
