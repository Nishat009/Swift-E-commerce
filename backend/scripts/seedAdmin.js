require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { assertSafeToSeed } = require('./safety');
const { ADMIN_EMAIL, CUSTOMER_EMAIL, seedPassword, passwordHint } = require('./seedConfig');
const mongoose = require('mongoose');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = assertSafeToSeed('seedAdmin');
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (adminUser) {
      console.log('Admin account found. Updating role & password...');
      adminUser.name = 'Master Admin';
      adminUser.role = 'admin';
      adminUser.password = seedPassword();
      adminUser.twoFactorEnabled = false;
      await adminUser.save();
      console.log(`Successfully updated existing user ${ADMIN_EMAIL} to Admin role.`);
    } else {
      console.log(`Creating fixed admin account ${ADMIN_EMAIL}...`);
      await User.create({
        name: 'Master Admin',
        email: ADMIN_EMAIL,
        password: seedPassword(),
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
      console.log(`Successfully created admin account ${ADMIN_EMAIL}.`);
    }

    let testUser = await User.findOne({ email: CUSTOMER_EMAIL });

    if (testUser) {
      console.log('Test user account found. Updating password...');
      testUser.name = 'Test User';
      testUser.role = 'customer';
      testUser.password = seedPassword();
      testUser.twoFactorEnabled = false;
      await testUser.save();
      console.log(`Successfully updated existing test user ${CUSTOMER_EMAIL}.`);
    } else {
      console.log(`Creating fixed test user account ${CUSTOMER_EMAIL}...`);
      await User.create({
        name: 'Test User',
        email: CUSTOMER_EMAIL,
        password: seedPassword(),
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
      console.log(`Successfully created test user account ${CUSTOMER_EMAIL}.`);
    }
    console.log(`Both accounts sign in with ${passwordHint()}.`);
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seedAdmin();
