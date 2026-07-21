require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Campaign = require('../src/models/Campaign');
const Ticket = require('../src/models/Ticket');
const User = require('../src/models/User');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for simulating campaigns and purchases...');

    // 1. Ensure we have enough mock customer users
    let customers = await User.find({ role: 'customer' });
    const requiredMockCount = 10;
    
    if (customers.length < requiredMockCount) {
      console.log(`Currently only ${customers.length} customers exist. Creating additional mock users...`);
      const mockUsersData = [
        { name: 'John Doe', email: 'john@email.com', password: 'password123', phone: '111-222-3333' },
        { name: 'Sarah Connor', email: 'sarah@email.com', password: 'password123', phone: '222-333-4444' },
        { name: 'Bruce Wayne', email: 'bruce@email.com', password: 'password123', phone: '333-444-5555' },
        { name: 'Tony Stark', email: 'tony@email.com', password: 'password123', phone: '444-555-6666' },
        { name: 'Peter Parker', email: 'peter@email.com', password: 'password123', phone: '555-666-7777' },
        { name: 'Clark Kent', email: 'clark@email.com', password: 'password123', phone: '666-777-8888' },
        { name: 'Diana Prince', email: 'diana@email.com', password: 'password123', phone: '777-888-9999' }
      ];

      for (const userData of mockUsersData) {
        const existing = await User.findOne({ email: userData.email });
        if (!existing) {
          await User.create(userData);
        }
      }
      customers = await User.find({ role: 'customer' });
      console.log(`Mock users created. Total customers now available: ${customers.length}`);
    } else {
      console.log(`Sufficient customer users found: ${customers.length}`);
    }

    // 2. Define the new set of active luxury campaigns
    const campaignTemplates = [
      {
        title: 'Rolex Cosmograph Daytona Campaign',
        productTitle: 'Swift Classic Leather Wristband',
        productPrice: 45.00,
        productDescription: 'Handcrafted premium calfskin leather strap. Purchase earns a direct entry ticket to win a Rolex Cosmograph Daytona!',
        productImage: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=400&q=80',
        prizeName: 'Rolex Cosmograph Daytona (Oystersteel, Black Dial)',
        prizeDescription: 'The legendary chronograph watch with tachymetric scale bezel and high precision mechanical chronograph caliber.',
        prizeImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=80',
        ticketLimit: 40,
        ticketsSold: 25,
        status: 'active'
      },
      {
        title: 'iPad Pro M4 Space Black Campaign',
        productTitle: 'Swift Matte Screen Protector',
        productPrice: 19.99,
        productDescription: 'Anti-glare paper-like screen protector. Purchase earns a direct entry ticket to win an iPad Pro M4!',
        productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80',
        prizeName: 'iPad Pro M4 (13-inch, Space Black, 1TB)',
        prizeDescription: 'Featuring the state-of-the-art Apple M4 chip, ultra-thin design, and tandem OLED Liquid Retina XDR screen.',
        prizeImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80',
        ticketLimit: 50,
        ticketsSold: 30,
        status: 'active'
      },
      {
        title: 'Tesla Model Y Performance Campaign',
        productTitle: 'Swift Premium Car Air Freshener',
        productPrice: 9.99,
        productDescription: 'Organic cedarwood and citrus scent pod. Purchase earns a direct entry ticket to win a Tesla Model Y!',
        productImage: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=400&q=80',
        prizeName: 'Tesla Model Y Performance Dual Motor',
        prizeDescription: 'All-wheel drive, dual motor performance, 0-60 in 3.5 seconds, and full autopilot hardware package.',
        prizeImage: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=400&q=80',
        ticketLimit: 200,
        ticketsSold: 120,
        status: 'active'
      }
    ];

    const createdCampaigns = [];
    for (const template of campaignTemplates) {
      // Avoid duplicate title seeds
      let campaign = await Campaign.findOne({ title: template.title });
      if (!campaign) {
        campaign = await Campaign.create(template);
        console.log(`Created Campaign: "${campaign.title}"`);
      } else {
        // Reset existing campaigns back to active for testing
        campaign.status = 'active';
        campaign.winnerUser = null;
        campaign.winnerTicket = '';
        campaign.ticketsSold = template.ticketsSold;
        await campaign.save();
        
        // Remove old tickets for this campaign
        await Ticket.deleteMany({ campaign: campaign._id });
        console.log(`Reset and cleared old tickets for Campaign: "${campaign.title}"`);
      }
      createdCampaigns.push(campaign);
    }

    // 3. Populate ticket entries for each active campaign using random users
    console.log('\nSimulating ticket purchases with random customer users...');
    for (const campaign of createdCampaigns) {
      const ticketsToGenerate = campaign.ticketsSold;
      const sampleTickets = [];
      
      for (let i = 0; i < ticketsToGenerate; i++) {
        // Select a random user from customers pool
        const randomUser = customers[Math.floor(Math.random() * customers.length)];
        const ticketSuffix = Math.floor(100000 + Math.random() * 900000);
        
        sampleTickets.push({
          ticketNumber: `TKT-${campaign.title.substring(0, 4).toUpperCase()}-${ticketSuffix}`,
          user: randomUser._id,
          campaign: campaign._id,
          purchaseAmount: campaign.productPrice,
          paymentMethod: 'simulated_wallet',
          status: 'active'
        });
      }

      await Ticket.insertMany(sampleTickets);
      console.log(`Generated ${ticketsToGenerate} tickets for "${campaign.title}" across random users.`);
    }

    console.log('\nSimulation script finished successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error running simulation script:', error);
    process.exit(1);
  }
};

run();
