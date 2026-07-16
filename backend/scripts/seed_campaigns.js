require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Campaign = require('../src/models/Campaign');
const Ticket = require('../src/models/Ticket');
const User = require('../src/models/User');

const seedCampaigns = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart');
    console.log('MongoDB Connected for Seeding Campaigns...');

    // Clear old campaigns & tickets
    await Campaign.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Cleared existing Campaigns and Tickets.');

    // Fetch a user for mock entries and winners
    let testUser = await User.findOne({ email: 'customer@email.com' });
    if (!testUser) {
      // Fallback: fetch any user
      testUser = await User.findOne({});
    }

    if (!testUser) {
      console.log('Error: Please run standard seed script first to create users!');
      process.exit(1);
    }

    console.log(`Mapping mock entries to user: ${testUser.name} (${testUser.email})`);

    // Create 3 luxury campaigns
    const campaigns = [
      {
        title: 'iPhone 16 Pro Campaign',
        productTitle: 'Swift Executive Classic Gold Pen',
        productPrice: 15.00,
        productDescription: 'An elegant brass ballpoint pen plated in 18K gold. Features fluid ink flow and luxury engraving. Every purchase grants a free entry into the Desert Titanium iPhone 16 Pro Max drawing!',
        productImage: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80',
        prizeName: 'iPhone 16 Pro Max (Desert Titanium, 512GB)',
        prizeDescription: 'Experience the cutting-edge A18 Pro chip, class-leading camera systems, and aerospace-grade titanium frame. The absolute pinnacle of mobile devices.',
        prizeImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
        ticketLimit: 30,
        ticketsSold: 18,
        status: 'active'
      },
      {
        title: 'Suzuki GSX-R150 Sports Bike Campaign',
        productTitle: 'Swift Premium Heavyweight Cotton Tee',
        productPrice: 29.00,
        productDescription: 'Made of 300GSM premium combed cotton, pre-shrunk, and cut in a tailored boxy fit. Every purchase grants a free entry ticket into the Suzuki GSX-R150 drawing!',
        productImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        prizeName: 'Suzuki GSX-R150 Sports Motorcycle',
        prizeDescription: 'A pure racing sports machine featuring MotoGP-derived technology, lightweight aerodynamic frame, DOHC fuel-injected engine, and high keyless ignition features.',
        prizeImage: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
        ticketLimit: 120,
        ticketsSold: 85,
        status: 'active'
      },
      {
        title: 'Weekend Maldives Getaway Campaign',
        productTitle: 'Swift Classic Leather Key Organizer',
        productPrice: 12.00,
        productDescription: 'Crafted from top-grain vegetable-tanned leather. Holds up to 7 keys in a silent, scratch-free profile. Earn entry tickets to win an all-expense-paid trip!',
        productImage: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=600&q=80',
        prizeName: '4-Day All-Inclusive Vacation in Maldives',
        prizeDescription: 'Live in a premium overwater villa at the Grand Palace Maldives Resort, including premium dynamic spa treatment, flight fares, and private chef dinners.',
        prizeImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80',
        ticketLimit: 50,
        ticketsSold: 50,
        status: 'completed',
        winnerUser: testUser._id,
        winnerTicket: 'SWIFT-TKT-MALD-391',
        winnerVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      }
    ];

    const createdCampaigns = await Campaign.create(campaigns);
    console.log(`Seeded ${createdCampaigns.length} campaigns.`);

    // Seed mock ticket entries
    const sampleTickets = [];
    
    // Add 18 tickets to iPhone campaign
    for (let i = 0; i < 18; i++) {
      sampleTickets.push({
        ticketNumber: `SWIFT-TKT-IPHONE-${1000 + i}`,
        user: testUser._id,
        campaign: createdCampaigns[0]._id,
        status: 'active'
      });
    }

    // Add 85 tickets to Suzuki campaign
    for (let i = 0; i < 85; i++) {
      sampleTickets.push({
        ticketNumber: `SWIFT-TKT-SUZUKI-${1000 + i}`,
        user: testUser._id,
        campaign: createdCampaigns[1]._id,
        status: 'active'
      });
    }

    // Add winning ticket for completed Maldives campaign
    sampleTickets.push({
      ticketNumber: 'SWIFT-TKT-MALD-391',
      user: testUser._id,
      campaign: createdCampaigns[2]._id,
      status: 'won'
    });

    // Add 49 other lost entries to Maldives
    for (let i = 0; i < 49; i++) {
      sampleTickets.push({
        ticketNumber: `SWIFT-TKT-MALD-${1000 + i}`,
        user: testUser._id,
        campaign: createdCampaigns[2]._id,
        status: 'lost'
      });
    }

    await Ticket.create(sampleTickets);
    console.log(`Seeded ${sampleTickets.length} tickets successfully.`);

    console.log('Seeding Campaigns finished!');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding campaigns failed:', err);
    process.exit(1);
  }
};

seedCampaigns();
