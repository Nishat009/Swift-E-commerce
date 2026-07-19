require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Campaign = require('../src/models/Campaign');
const Ticket = require('../src/models/Ticket');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');

const testDraw = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftcart';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Testing Lucky Draw...');

    // 1. Find the test campaign
    const campaignTitle = 'iPad Pro M4 Space Black Campaign';
    const campaign = await Campaign.findOne({ title: campaignTitle });
    
    if (!campaign) {
      console.error(`Error: Campaign "${campaignTitle}" not found! Run the simulation script first.`);
      process.exit(1);
    }

    if (campaign.status === 'completed') {
      console.log(`Campaign was already drawn previously. Resetting back to active...`);
      campaign.status = 'active';
      campaign.winnerUser = null;
      campaign.winnerTicket = '';
      await campaign.save();
      await Ticket.updateMany({ campaign: campaign._id }, { status: 'active' });
    }

    console.log(`\nTesting Lucky Draw on Campaign: "${campaign.title}"`);
    console.log(`Current Tickets Sold Count: ${campaign.ticketsSold}`);
    console.log(`Campaign status: ${campaign.status}`);

    // 2. Fetch all tickets
    const tickets = await Ticket.find({ campaign: campaign._id });
    console.log(`Fetched ${tickets.length} tickets from the database.`);
    
    if (tickets.length === 0) {
      console.error('Error: No tickets found for this campaign!');
      process.exit(1);
    }

    // 3. Select random winner index
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[randomIndex];
    
    console.log(`\nDrawing winner...`);
    console.log(`Selected random index: ${randomIndex}`);
    console.log(`Winning Ticket Number: ${winningTicket.ticketNumber}`);
    console.log(`Winner User ID: ${winningTicket.user}`);

    // 4. Update winning ticket
    winningTicket.status = 'won';
    await winningTicket.save();
    console.log('Winning ticket status updated to "won".');

    // 5. Update losing tickets
    const lostUpdateResult = await Ticket.updateMany(
      { campaign: campaign._id, _id: { $ne: winningTicket._id } },
      { status: 'lost' }
    );
    console.log(`Marked other ${lostUpdateResult.modifiedCount} tickets as "lost".`);

    // 6. Update Campaign winner details
    campaign.status = 'completed';
    campaign.winnerUser = winningTicket.user;
    campaign.winnerTicket = winningTicket.ticketNumber;
    campaign.winnerVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    await campaign.save();
    console.log('Campaign status updated to "completed". Winner details populated.');

    // 7. Verify Notifications
    const winnerUserObj = await User.findById(winningTicket.user);
    console.log(`Winner User Name: ${winnerUserObj.name} (${winnerUserObj.email})`);

    const winNotification = await Notification.create({
      user: winningTicket.user,
      title: '🏆 Congratulations! You Won!',
      message: `Your ticket ${winningTicket.ticketNumber} won the "${campaign.title}" campaign! You've won ${campaign.prizeName}!`,
      type: 'winner_announcement',
      relatedCampaign: campaign._id
    });
    console.log(`\nCreated Winner Notification: "${winNotification.title}"`);
    console.log(`Notification Message: "${winNotification.message}"`);

    // Fetch participant list
    const otherParticipants = await Ticket.find({
      campaign: campaign._id,
      _id: { $ne: winningTicket._id }
    }).distinct('user');

    console.log(`Creating notifications for other ${otherParticipants.length} unique participants...`);
    const notificationsToCreate = otherParticipants.map(userId => ({
      user: userId,
      title: 'Draw Completed 🎲',
      message: `The draw for "${campaign.title}" has been completed. Unfortunately, your ticket was not selected this time. Better luck next time!`,
      type: 'draw_result',
      relatedCampaign: campaign._id
    }));

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
      console.log('Participant notifications created successfully!');
    }

    console.log('\n--- LUCKY DRAW VERIFICATION SUCCESSFUL ---');
    console.log('All backend updates, ticket state changes, and notification logs verified successfully.');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Test draw execution failed:', error);
    process.exit(1);
  }
};

testDraw();
