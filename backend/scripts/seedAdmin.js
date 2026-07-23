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
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seedAdmin();
